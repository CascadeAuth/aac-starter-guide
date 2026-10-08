Canonical: https://docs.cascadeauth.com/sidecar/a2a/

Applies to: AAC Sidecar v0.5.2

Documentation revision: b472c2a40997f0e825a432a1d00babc050f88f88

---

# A2A integration

Agent-to-Agent (A2A) is an open protocol for one agent to send a message to
another over HTTPS, using JSON-RPC 2.0 and a published Agent Card that says
how to reach the agent. AAC supports A2A: the sidecar beside your agent
receives A2A messages from other organizations' agents, verifies the sender's
delegated authority before your handler sees the message, and sends your
agent's A2A messages to configured peers under authority it mints and signs.

This page is the home for A2A on this site. It explains what is supported,
walks through enabling A2A for one agent and sending a first message, and
documents the `a2a` configuration block, the dispatch envelope, the Agent Card
and the A2A errors and audit events.

## What AAC adds to A2A

A plain A2A call proves nothing about who authorized it. With AAC, every A2A
request between two sidecars carries a delegated authority chain and a
proof-of-possession signature. The receiving sidecar checks both against the
public trust material of the sender's tenant, confirms that its own agent is
the intended recipient, and only then hands the unchanged A2A message to your
handler together with verified context: which tenant started the task, which
workload is presenting, and the task reference. Your handler never sees or
handles the credentials.

Choose A2A when the other agent speaks A2A, or when your agent already exposes
an A2A handler. Choose [native AAC delivery](https://docs.cascadeauth.com/sidecar/integration/) when both
sides are AAC sidecars and you want the forward, settle and refuse decision
flow with signed terminal receipts. One sidecar can do both; the native example
on the integration page runs the two side by side.

## What is supported

| Surface | Supported profile |
|---|---|
| Protocol | A2A 1.0 over JSON-RPC 2.0; exactly one `A2A-Version: 1.0` header; no extensions |
| Method | Unary `SendMessage` only |
| Message parts | `text`, and `data` with `mediaType: application/json`; `acceptedOutputModes` limited to `text/plain` and `application/json` |
| Reply | One `message` from the agent, or one task in a terminal state |
| Discovery | `GET /.well-known/agent-card.json` on the sidecar's external listener |
| Sending | Your paired agent asks its own sidecar to dispatch to a configured destination; the sidecar never fetches a peer's card or follows a redirect |
| Retries | A dispatch has an identifier; an identical retry returns the retained outcome and never repeats the operation |
| Not supported | Streaming, server-sent events, task lifecycle and multi-turn tasks, push notifications, extended cards, file, raw or URL parts, gRPC, HTTP+JSON binding, A2A 0.3 compatibility |

An unsupported method is answered with a JSON-RPC error, not with a fallback.

## How a message travels

Receiving, from a peer's sidecar to your handler:

```text
peer sidecar ──HTTPS: POST /a2a/v1──▶ your sidecar (external listener)
                                     verifies the AAC authority and DPoP proof,
                                     checks you are the intended recipient,
                                     admits the body within configured limits
                                   ──HTTP: POST /a2a/v1──▶ your handler
                                     unchanged A2A body + verified X-AAC-* headers,
                                     signed with the pairing secret
                                   ◀── your JSON-RPC reply ──
peer sidecar ◀── the same reply, after the sidecar checks it fits the profile
```

Sending, from your agent to a peer:

```text
your agent ──HTTP: POST /v1/agent/a2a/dispatch──▶ your sidecar (loopback listener)
            signed envelope naming a destination,     mints the authority,
            an authority mode and the A2A request     claims the dispatch id
                                                 ──HTTPS: POST /a2a/v1──▶ peer sidecar
                                                 ◀── peer's reply ──
your agent ◀── {"a2a_response": <peer's reply>, "dispatch_id": "…", "status": "dispatched"} ──
```

The sidecar validates the peer's reply against the profile and returns it to
your agent inside the acknowledgement, as the exact bytes the peer sent. The
whole acknowledgement is retained for the retry window, so an identical retry
returns the reply too. A dispatch is therefore a request and its response in
one call, the same shape as A2A itself.

## Set up A2A for your agent

You need a registered tenant and agent and a sidecar running beside the
agent. If you have neither, [start the AAC journey](https://docs.cascadeauth.com/get-started/) first; the
[CLI guide](https://docs.cascadeauth.com/cli/guide/) covers tenant and agent
registration. The steps below add A2A to an agent prepared with the CLI's init command.

### 1. Enable A2A in the configuration

Add an `a2a` section to the agent's configuration file, the YAML you pass to
the init command's `--agent-config` option. Two values are yours to choose: the HTTPS address at
which peers reach your sidecar, and the local address of your handler.

```yaml
a2a:
  public_base_url: "https://orders.example.com"
  local_handler_url: "http://127.0.0.1:8000/a2a/v1"
```

Then run the same init command you used for the agent, for example:

```bash
aac init --profile stage --agent orders --agent-config orders.yaml
```

The CLI writes a complete `a2a` block into the agent's sidecar configuration
with the request limits, a 60-second deadline, and both sending blocks
(`continuation_authority` and `egress_idempotency`) with managed state paths.
The public address must be `https://` with no path; the handler address must
end in exactly `/a2a/v1`. The field table on the
[CLI package page](https://pypi.org/project/aac-cli/) lists the accepted
values. Restart the sidecar after the command finishes.

If you maintain the sidecar YAML yourself, copy the `a2a` section of the
[configuration template](https://docs.cascadeauth.com/sidecar-config.template.yaml) and set every value;
the [`a2a` settings](https://docs.cascadeauth.com/sidecar/a2a/#the-a2a-configuration-block) below give each bound. An
agent that only receives A2A messages can leave out both sending blocks; see
[receive A2A messages without sending](https://docs.cascadeauth.com/sidecar/configuration/#receive-a2a-messages-without-sending).
In either form, `sidecar.agent_invoke_auth.secret_file` is required whenever an
`a2a` block is present, because the sidecar signs every call to your handler.

### 2. Write the A2A handler

Your agent serves `POST /a2a/v1` on the local handler address. The sidecar
calls it with the peer's A2A request body unchanged and these verified
headers, all covered by the pairing signature:

| Header | Meaning |
|---|---|
| `X-AAC-Context-Schema` | Always `aac.a2a.ingress-context.v1` |
| `X-AAC-Task-Ref` | The task the sender's authority is restricted to |
| `X-AAC-Presenter-Spiffe-Id` | The verified workload identity that sent the message |
| `X-AAC-Originator-Tenant-Id` | The tenant whose agent started the task |
| `X-AAC-Root-Token-Id`, `X-AAC-Presenter-Token-Id`, `X-AAC-Hop-Index` | Correlation with the authority chain; the presenter token id is also the handle for continuing the authority when you send onward |
| `X-AAC-Invoke-Timestamp`, `X-AAC-Invoke-Signature` | The pairing signature your handler must verify before trusting any of the above |

Verify the pairing signature first, so that only your sidecar can reach the
handler. Python agents can use the published
[aac-invoke-auth](https://pypi.org/project/aac-invoke-auth/) package, as this
example does; other languages implement the
[pairing protocol](https://docs.cascadeauth.com/sidecar/integration/#pairing-authentication-for-any-language).
Save this as `a2a_agent.py`:

<!-- a2a-handler-example:start -->
```python
from fastapi import FastAPI, Request
from aac_invoke_auth.fastapi import InvokeAuthGuard, InvokeAuthMiddleware

app = FastAPI()
app.add_middleware(
    InvokeAuthMiddleware,
    guard=InvokeAuthGuard.from_env(),
    protected_paths=("/a2a/v1",),
)


@app.post("/a2a/v1")
async def a2a(request: Request):
    body = await request.json()
    message = body["params"]["message"]
    # The sidecar verified these before calling; they are context, not credentials.
    sender = request.headers["X-AAC-Presenter-Spiffe-Id"]
    task = request.headers["X-AAC-Task-Ref"]
    text = " ".join(part.get("text", "") for part in message["parts"])
    return {
        "jsonrpc": "2.0",
        "id": body["id"],
        "result": {
            "message": {
                "messageId": message["messageId"] + "-reply",
                "contextId": task,
                "role": "ROLE_AGENT",
                "parts": [{"text": f"Received {len(text)} characters from {sender} for {task}"}],
            }
        },
    }
```
<!-- a2a-handler-example:end -->

The handler and the send script in step 4 run in a Python environment of
your own on the agent's host. Installing the CLI does not provide their
packages, so create the environment once and install them:

```bash
python -m venv "$HOME/.aac/a2a-env"
source "$HOME/.aac/a2a-env/bin/activate"
python -m pip install --upgrade 'aac-invoke-auth[fastapi]' uvicorn httpx
```

Then start the handler in that environment with the pairing secret the CLI
placed in the agent folder, in the same network namespace as the sidecar:

```bash
export AAC_INVOKE_AUTH_SECRET_FILE="$HOME/.aac/agents/orders/agent/pairing.secret"
python -m uvicorn a2a_agent:app --host 127.0.0.1 --port 8000
```

The handler must answer within the configured deadline with HTTP 200,
`Content-Type: application/json`, no compression, and a JSON-RPC 2.0 response
that preserves the request `id` and contains exactly one `result` or `error`.
A `result` holds exactly one `message` (nonempty `messageId` and `contextId`,
`role` `ROLE_AGENT`, at least one `text` or `data` part) or one `task` in a
terminal state (`id`, `contextId`, `status.state`). An `error` has an integer
`code` and a nonempty `message`. A response outside this profile is refused by
the sidecar and reported to the peer as `ERR_INVALID_AGENT_RESPONSE`. Values
shaped like AAC credentials are refused anywhere in the response.

A handler that serves only `/a2a/v1` is enough for A2A. The sidecar also has an
`agent_invoke_url` for native delivery; if no native message is ever sent to
this agent, that path is never called.

### 3. Name the destination and the authority

Sending needs two more entries in the agent configuration: a destination that
names the peer, and a class of action that describes the authority your agent
will mint for the message. Both use the same fields as native delivery.

```yaml
destinations:
  partner_a2a:
    url: "https://partner.example.net/a2a/v1"
    audience_pattern: "spiffe://partner.example.net/agents/approvals"
    predicates: {action: "request_quote"}
    valid_for: "+5m"
    timeout_ms: 10000
classes_of_action:
  request_quote:
    predicates: {action: "request_quote"}
    valid_for: "+10m"
```

The destination `url` is the peer's public base URL plus `/a2a/v1`, the
address its Agent Card advertises, and `audience_pattern` is the peer agent's
exact registered SPIFFE ID: the peer's sidecar refuses a message whose
audience is not its own identity. Predicates come from the
[registered vocabulary](https://docs.cascadeauth.com/sidecar/integration/#authority-predicates-and-a2a-integration);
agree their business meaning with the peer. When sending is enabled, every
destination's `timeout_ms` must be positive and no greater than the A2A
deadline. Run the init command again to apply the change, then restart the
sidecar.

Your sidecar must also trust the peer, and the peer must trust you: each
receiver lists the sender's tenant under `trust_anchors.tenant_ids` and the
sender's trust domain under `spiffe_bundles.trust_domains`, and both tenants
publish their trust material with the
[trust anchor publisher](https://docs.cascadeauth.com/trust-anchor-publisher/).
[Two agents across tenants](https://docs.cascadeauth.com/sidecar/a2a/#two-agents-across-tenants) lists everything the
two sides exchange.

### 4. Send a message

Your agent sends by posting a signed envelope to its own sidecar's loopback
listener. The envelope names the destination, states how the sidecar should
obtain authority, and carries the A2A request. Save this as `a2a_send.py`:

<!-- a2a-send-example:start -->
```python
import json
import os
import sys
import time
import uuid
from pathlib import Path

import httpx
from aac_invoke_auth import sign_invoke_request

DISPATCH_PATH = "/v1/agent/a2a/dispatch"


def send_message(client, secret, destination_profile, class_of_action, human_originator, text):
    task_ref = "a2a-" + str(uuid.uuid4())
    envelope = {
        "schema_version": "aac.a2a.egress.v1",
        "dispatch_id": str(uuid.uuid4()),
        "destination_profile": destination_profile,
        "task_ref": task_ref,
        "authority": {
            "mode": "originate",
            "class_of_action": class_of_action,
            "human_originator": human_originator,
        },
        "additional_predicates": {},
        "a2a_request": {
            "jsonrpc": "2.0",
            "id": task_ref,
            "method": "SendMessage",
            "params": {
                "message": {
                    "messageId": str(uuid.uuid4()),
                    "role": "ROLE_USER",
                    "parts": [{"text": text}],
                }
            },
        },
    }
    body = json.dumps(envelope, separators=(",", ":")).encode()

    def post():
        headers = {"Content-Type": "application/json", "X-AAC-Envelope-Schema": "aac.a2a.egress.v1"}
        headers.update(
            sign_invoke_request(secret=secret, method="POST", path=DISPATCH_PATH, headers=headers, body=body)
        )
        return client.post(DISPATCH_PATH, headers=headers, content=body)

    response = post()
    if response.status_code != 200:
        raise RuntimeError(f"dispatch refused: HTTP {response.status_code} {response.text}")
    # A retry keeps the dispatch_id and the exact bytes; the sidecar answers from
    # the retained outcome instead of sending the message again.
    retry = post()
    if retry.content != response.content:
        raise RuntimeError("an identical retry returned a different outcome")
    return response.json()


if __name__ == "__main__":
    secret = Path(os.environ["AAC_INVOKE_AUTH_SECRET_FILE"]).read_bytes().strip()
    # A real agent takes these claims from the signed-in user's session.
    human = {"iss": "https://synthetic.invalid", "sub": "demo-only", "auth_time_unix_seconds": int(time.time())}
    with httpx.Client(base_url="http://127.0.0.1:8080", timeout=65, trust_env=False) as client:
        result = send_message(
            client,
            secret,
            os.environ.get("AAC_A2A_DESTINATION", "partner_a2a"),
            os.environ.get("AAC_A2A_CLASS", "request_quote"),
            human,
            " ".join(sys.argv[1:]) or "Hello from an AAC-enabled agent",
        )
        print(json.dumps(result, indent=2))
```
<!-- a2a-send-example:end -->

In a second terminal with the same environment active:

```bash
source "$HOME/.aac/a2a-env/bin/activate"
export AAC_INVOKE_AUTH_SECRET_FILE="$HOME/.aac/agents/orders/agent/pairing.secret"
python a2a_send.py "Please quote two seats to Lisbon"
```

The `human_originator` claims identify the person on whose behalf the agent
acts. The example uses synthetic values; a real agent fills them from its own
authenticated session, and AAC does not turn them into an authentication.

### 5. What success looks like

A delivered message prints the acknowledgement with the peer's reply inside it:

```json
{
  "a2a_response": {
    "jsonrpc": "2.0",
    "id": "a2a-3d9f0c2e-7b41-4e6a-9c58-1f2a3b4c5d6e",
    "result": {
      "message": {
        "messageId": "7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f",
        "contextId": "quote-lisbon-2",
        "role": "ROLE_AGENT",
        "parts": [{"text": "Two seats to Lisbon held until 18:00"}]
      }
    }
  },
  "dispatch_id": "6f1c0a8e-3b2d-4c7e-9a1f-2d3e4f5a6b7c",
  "status": "dispatched"
}
```

Behind that output, the peer's sidecar verified your authority, the peer's
handler answered, and your sidecar checked the answer against the profile
before placing it in `a2a_response`, byte for byte as the peer sent it. The
JSON-RPC `id` matches your request, and the reply holds either `result`, the
peer agent's message or terminal task, or a JSON-RPC `error` the peer
returned. `status: dispatched` confirms delivery and a well-formed reply, not
the peer's success: inspect `a2a_response` for `error` before acting on it.
The second, identical post in the example returned the same bytes, reply
included, without a second delivery. In your sidecar's telemetry sink, the `a2a_egress` event
records `result: accepted`; on the peer, `a2a_ingress` records `accepted` and
the handler's log shows one `POST /a2a/v1`. See
[audit your workflows](https://docs.cascadeauth.com/sidecar/operations/#audit-your-workflows) for the
event fields.

A refusal prints the sidecar's error envelope with a `code` from the
[error table](https://docs.cascadeauth.com/sidecar/a2a/#errors-and-audit-events) below. Three kinds of answer need
different handling. A refusal that happened before the sidecar claimed your
identifier (a bad pairing signature or schema header, a malformed envelope, an
oversized or compressed body, or exhausted retained capacity) leaves nothing
behind: nothing was sent, no record exists, and the same identifier and bytes
may be retried after you fix the cause or back off. An in-progress answer
means your first attempt holds the claim and may be delivering right now, or
still after a sidecar restart: back off and retry the same identifier and
bytes, and do not conclude that nothing was sent. Every outcome decided after
the claim, including a delivered message, a refused destination or class, and
an uncertain or timed-out delivery, is retained under that identifier: an
identical retry returns the same answer without sending again. For an
uncertain or timed-out delivery, reconcile with the peer and issue a new
`dispatch_id` only once you know the operation was not performed. The
[responses table](https://docs.cascadeauth.com/sidecar/a2a/#the-dispatch-envelope) says which is which.

To exercise both directions on one machine before you have a peer, the
integration page's [runnable example](https://docs.cascadeauth.com/sidecar/integration/#optional-runnable-paired-agent-example)
runs an agent that handles native and A2A calls and a client that sends an A2A
message to the agent's own sidecar.

## The dispatch envelope

`POST /v1/agent/a2a/dispatch` exists on the loopback listener only when both
sending blocks are configured; a receive-only sidecar answers 404. The request
needs `Content-Type: application/json`, a body within
`a2a.max_request_body_bytes`, the pairing signature headers exactly once each,
and exactly one `X-AAC-Envelope-Schema: aac.a2a.egress.v1` header, which the
signature covers. The body is a JSON object with these fields and no others;
only `additional_predicates` may be omitted:

| Field | Value |
|---|---|
| `schema_version` | `aac.a2a.egress.v1` |
| `dispatch_id` | A lowercase UUID version 4, generated by your agent for this operation and kept for every retry |
| `destination_profile` | The name of a configured destination, 1–128 characters of `a-z`, digits, `_`, `.` and `-`, starting with a letter; never a URL |
| `task_ref` | 1–256 printable ASCII characters naming the task, with no leading or trailing whitespace; the receiving handler sees it as `X-AAC-Task-Ref` |
| `authority` | One of the two modes below |
| `additional_predicates` | A JSON object, possibly empty, of registered predicate names that narrow the authority; at most 64 keys; a `task_ref` predicate must equal the envelope's `task_ref` |
| `a2a_request` | The JSON-RPC 2.0 `SendMessage` request itself, within the same body, depth and node limits as inbound requests |

Authority modes:

- **`originate`** starts a new task. The object holds exactly `mode`,
  `class_of_action` (a configured class) and `human_originator` with `iss`,
  `sub` and `auth_time_unix_seconds`. The sidecar mints root authority under
  the class, then delegates it to the destination with the destination's
  predicates and validity.
- **`continue`** carries an inbound message's authority onward. The object
  holds exactly `mode` and `presenter_token_id`, the value your handler
  received as `X-AAC-Presenter-Token-Id`, and the envelope's `task_ref` must be
  the inbound `X-AAC-Task-Ref`. The sidecar resolves the verified authority it
  retained when it delivered that message to your handler, scoped to this
  pair, task and presenter, and valid for the shorter of the chain's expiry
  and `continuation_authority.retention_seconds`. The handle is not a
  credential: a different pair, task or presenter, an expired lease or a
  restarted sidecar all answer `ERR_CONTINUATION_AUTHORITY_UNAVAILABLE`.

Responses:

| HTTP | Body | Meaning |
|---|---|---|
| 200 | `{"a2a_response": <peer's reply>, "dispatch_id": "…", "status": "dispatched"}` | Delivered; the peer's reply passed the profile check and is returned as the peer sent it, whether it carries `result` or a JSON-RPC `error` |
| 200, 4xx or 5xx | The retained first outcome | An identical retry of a dispatch whose outcome was decided after the claim; same status and bytes as the first time |
| 409 `ERR_EGRESS_DISPATCH_IN_PROGRESS` | error envelope | Not retained. The first attempt is still running; back off and retry the same identifier and bytes |
| 409 `ERR_EGRESS_IDEMPOTENCY_CONFLICT` | error envelope | Not retained. The identifier was reused with a different body; the first claim still governs it, so keep the original bytes or start a new operation |
| 503 `ERR_EGRESS_IDEMPOTENCY_SATURATED` | error envelope | Not retained and not claimed: nothing was sent. Retained capacity for the pair is full; back off and retry the same identifier and bytes once entries expire, or raise the capacity settings |
| 401 `ERR_INVALID_REQUEST` | error envelope | Before the claim: the pairing signature or the schema header is missing or wrong |
| 413 `ERR_REQUEST_TOO_LARGE`, 415 `ERR_INVALID_REQUEST` | error envelope | Before the claim: the envelope exceeds `max_request_body_bytes`, is not `application/json`, or is compressed |
| 400 `ERR_INVALID_REQUEST` (malformed envelope) | error envelope | Before the claim: the envelope fails the field rules above |
| 400 `ERR_INVALID_REQUEST` (predicates) | error envelope | Retained: `additional_predicates` do not narrow the destination's authority |
| 404 `ERR_DESTINATION_NOT_FOUND`, `ERR_CLASS_OF_ACTION_NOT_FOUND` | error envelope | Retained: the envelope named something not configured |
| 409 `ERR_CONTINUATION_AUTHORITY_UNAVAILABLE` | error envelope | Retained: no live retained authority for this pair, task and presenter |
| 502 `ERR_A2A_REMOTE_REJECTED`, `ERR_INVALID_AGENT_RESPONSE` | error envelope | Retained: the peer answered with a non-200 status, or with a reply outside the profile |
| 502 `ERR_A2A_DISPATCH_UNCERTAIN`, 504 `ERR_A2A_DISPATCH_TIMEOUT` | error envelope | Retained: the outcome is unknown; an identical retry returns this same answer and does not resend. Reconcile with the peer, and issue a new `dispatch_id` only once you have confirmed the operation was not performed |
| 503 `ERR_CONFIG_ERROR` | error envelope | Retained: the named class or destination has invalid settings |

A refusal marked "before the claim", and a saturation refusal, sent nothing
and left no record, so the same identifier and bytes may be used again once the
cause is fixed. An in-progress answer is different: the first claim stands and
may still be delivering, so keep the same identifier and bytes and back off.
Retained
outcomes are kept for `egress_idempotency.retention_seconds` from the first
claim, across sidecar restarts, in the `state_file`. Retention is a bounded
guarantee, not permanent deduplication: after it expires the same identifier
is accepted as a new operation.

## The `a2a` configuration block

Every value is explicit; there is no default body size and no unlimited mode.
Size the limits for your deployment and test them before use.

| Setting | Meaning | Accepted values |
|---|---|---|
| `public_base_url` | The HTTPS origin at which peers reach your sidecar's external listener; printed on the Agent Card as `<public_base_url>/a2a/v1` | `https://` URL with a host and no path other than `/`, no query, fragment or credentials |
| `local_handler_url` | Your agent's A2A handler, called with the unchanged verified body | `http://` or `https://` URL whose path is exactly `/a2a/v1` |
| `max_request_body_bytes` | Bound on an inbound request body, a dispatch envelope and the replies the sidecar reads from your handler and from peers | Positive integer; required |
| `deadline_seconds` | End-to-end budget for an inbound request, from admission to the written response, and for each dispatch; when sending is enabled, every destination `timeout_ms` must fit within it | 1–60 |
| `max_concurrent_requests` | Inbound requests admitted at once; beyond it the sidecar answers 503 `ERR_A2A_OVERLOADED` | Positive integer |
| `max_json_nesting_depth` | Deepest JSON nesting accepted in any A2A body | 1–32 |
| `max_json_nodes` | Most JSON values accepted in any A2A body | 1–10000 |
| `agent_card` | Optional description of your agent for the public card | See [describe your agent on its A2A Agent Card](https://docs.cascadeauth.com/sidecar/configuration/#describe-your-agent-on-its-a2a-agent-card) |
| `continuation_authority.retention_seconds` | How long a verified inbound authority may be continued by a `continue` dispatch; it can only shorten the chain's own expiry | Positive integer; present together with `egress_idempotency` |
| `egress_idempotency.state_file` | The retained dispatch-outcome database, opened before either listener binds | Absolute path on storage that survives the process or container replacement you rely on; missing parents, an unusable file or a second owner stop startup |
| `egress_idempotency.retention_seconds` | How long a dispatch outcome supports safe retries | 120–86400, and at least twice `deadline_seconds` |
| `egress_idempotency.max_entries_per_pair` | Live dispatch identifiers retained for this agent pair; saturation refuses new dispatches rather than evicting live ones | Positive integer |
| `egress_idempotency.max_cached_response_body_bytes` | Largest outcome body retained for a dispatch, including the acknowledgement that carries the peer's reply | At least `max_request_body_bytes` + 92 (the acknowledgement framing), and at least 203; the sidecar refuses to start below either |
| `egress_idempotency.max_reserved_cached_bytes_per_pair` | Total outcome bytes reserved for the pair; usable dispatches are the smaller of `max_entries_per_pair` and this value divided by `max_cached_response_body_bytes` | At least `max_cached_response_body_bytes` |

Supply both sending blocks or neither; one without the other stops startup.
Without them the sidecar is receive-only. Size `max_entries_per_pair` for peak
new dispatches per second multiplied by `retention_seconds`, then set
`max_reserved_cached_bytes_per_pair` to that count multiplied by
`max_cached_response_body_bytes`; a smaller reservation lowers the usable
count to the reserved bytes divided by the per-dispatch maximum, whatever the
entry limit says. The reservation is an accounting bound, not allocated
storage: the database holds only the outcomes actually retained, so size the
file for the replies you expect plus storage overhead. The template's values
suit a small test, not a busy agent.

The retry database holds every delivered dispatch's acknowledgement, and with
it the peer's reply, for `retention_seconds`. Treat the file as business data:
restrict access to the sidecar's user, include it in the same backup and
retention decisions as the agent's own records, and expect its contents to
survive until expiry reclaims them. Expiry is reclamation, not secure erasure.

Local or remote redirects are never followed, so every URL must name its final
endpoint. The
[configuration reference](https://docs.cascadeauth.com/sidecar/configuration/#configuration-and-workflow-state)
explains how the A2A deadline interacts with the other timeouts.

## Agent Card and discovery

When an `a2a` block is present, the sidecar serves your agent's card at
`GET /.well-known/agent-card.json` on its external listener, so a peer that
knows your public base URL can discover how to call you. The card advertises:

- one interface: `<public_base_url>/a2a/v1`, binding `JSONRPC`, protocol
  version `1.0`;
- capabilities with streaming, push notifications and the extended card all
  `false`;
- two required security schemes, an `Authorization` header carrying the AAC
  authority credential and a `DPoP` header carrying the proof; a plain A2A
  client without an AAC sidecar cannot satisfy them;
- `text/plain` and `application/json` as the default input and output modes;
- your description: name, description, version, provider, documentation and
  icon links and skills, from the optional `agent_card` settings, with neutral
  defaults (`AAC-enabled agent`, version `unspecified`, one generic
  `unary-message` skill) when you give none. The card is built once at startup
  and is public; see
  [describe your agent on its A2A Agent Card](https://docs.cascadeauth.com/sidecar/configuration/#describe-your-agent-on-its-a2a-agent-card)
  for the fields and limits.

Check it from any machine that can reach the listener:

```bash
curl --fail --silent --show-error https://orders.example.com/.well-known/agent-card.json
```

Discovery is one-directional. Your sidecar publishes a card, but when sending
it never fetches the peer's card: it delivers to the configured destination
URL and audience, and refuses redirects. Read a peer's card to learn their
address and skills, then write what you learned into your destination entry.

## Two agents across tenants

Each side is an independent tenant with its own CA, agents and trust
publication. Exchange the following with the peer organization before the
first message; nothing private crosses the boundary.

| You give the peer | The peer gives you |
|---|---|
| Your tenant ID and trust domain, so their sidecar can list them under `trust_anchors.tenant_ids` and `spiffe_bundles.trust_domains` | Their tenant ID and trust domain, for your sidecar's two lists |
| Your sidecar's `public_base_url`, or simply your Agent Card address | Their public base URL, which becomes your destination `url` with `/a2a/v1` appended |
| Your agent's exact SPIFFE ID, which they set as `audience_pattern` | Their agent's exact SPIFFE ID, for your `audience_pattern` |
| The predicates and values you will send, and what they mean | The predicates they accept, and the skills their card lists |

Both tenants publish their root keys and CA certificates with the trust anchor
publisher; a sidecar polls the public trust material of every tenant it lists
and refuses a message from a tenant or domain it does not trust. Each side's
ingress must allow the other's sidecar to reach the external listener over
HTTPS at the final URL, with no redirect. Then:

1. Peer A adds the destination and class of action for B to its agent
   configuration and runs the init command; both restart their sidecars.
2. A's agent sends one message with `a2a_send.py`; it prints the acknowledgement with B's reply in `a2a_response` (its `result`, or a JSON-RPC `error` B returned) and `status` `dispatched`.
3. B's handler log shows one `POST /a2a/v1` carrying A's tenant and agent in
   the `X-AAC-Originator-Tenant-Id` and `X-AAC-Presenter-Spiffe-Id` headers;
   B's `a2a_ingress` event records `accepted`.
4. B answers A the same way, with its own destination for A and its own class
   of action, or continues A's authority with a `continue` dispatch inside the
   retention window.

A refusal at step 2 or 3 names its cause: `ERR_UNKNOWN_TENANT_KEY` or
`ERR_DPOP_CHAIN` on B means B does not yet trust A's published material;
`ERR_RECIPIENT_NOT_AUTHORIZED` means A's `audience_pattern` is not B's exact
SPIFFE ID; `ERR_A2A_REMOTE_REJECTED` on A reports B's refusal. For a
same-tenant run of two agents on one machine, the integration page's
[two-agent example](https://docs.cascadeauth.com/sidecar/integration/#work-through-two-agents) sets up
both processes and sends an A2A message between them.

## Errors and audit events

The sidecar writes two A2A event types to its telemetry sink: `a2a_ingress`
for every inbound request, with the protocol diagnostics `method`,
`protocol_version`, `result_kind` and `error_category` and the request size
against the configured limit, and `a2a_egress` for every dispatch, with the
retained-state pressure counters (`egress_entries`,
`egress_reserved_cached_bytes` and the cumulative reclaimed, saturation,
oversize, conflict, in-progress and cached-hit totals). A2A events use
`result` values `accepted`, `rejected`, `failed` or, for a caller that gave up
mid-request, `canceled`. The field list is in
[audit your workflows](https://docs.cascadeauth.com/sidecar/operations/#audit-your-workflows).

Errors before authority is verified use the sidecar's error envelope with a
stable `code`. The A2A-specific codes are:

| Code | Where | Meaning |
|---|---|---|
| `ERR_A2A_OVERLOADED` | inbound | The concurrency limit is reached; the peer backs off |
| `ERR_MISSING_AAC_MACAROON`, `ERR_MISSING_DPOP_PROOF` | inbound | The caller is not an AAC sidecar, or sent the credential headers wrongly |
| `ERR_REQUEST_TOO_LARGE`; `ERR_INVALID_REQUEST` with HTTP 415 | inbound and dispatch | The body exceeds `max_request_body_bytes`; the content type is not JSON or the body is compressed |
| `ERR_A2A_AUTHORITY_REGISTRATION_FAILED` | inbound | The verified authority could not be retained for continuation |
| `ERR_INVALID_AGENT_RESPONSE`, `ERR_AGENT_UNREACHABLE`, `ERR_AGENT_TIMEOUT` | inbound | Your handler answered outside the profile, was not reachable, or exceeded the deadline |
| `ERR_A2A_DISPATCH_FAILED`, `ERR_A2A_DISPATCH_TIMEOUT`, `ERR_A2A_DISPATCH_UNCERTAIN`, `ERR_A2A_REMOTE_REJECTED` | dispatch | Delivery to the peer failed, timed out, has an unknown outcome, or was refused by the peer |
| `ERR_EGRESS_DISPATCH_IN_PROGRESS`, `ERR_EGRESS_IDEMPOTENCY_CONFLICT`, `ERR_EGRESS_IDEMPOTENCY_SATURATED`, `ERR_EGRESS_RESPONSE_TOO_LARGE` | dispatch | Retained-state outcomes described in the envelope responses above |
| `ERR_CONTINUATION_AUTHORITY_UNAVAILABLE` | dispatch | No live retained authority for a `continue` dispatch |

After authority is verified, A2A protocol errors are JSON-RPC errors under
HTTP 200, with the request `id` preserved: `-32700` parse error, `-32600`
invalid request, `-32601` unknown method, `-32602` invalid parameters,
`-32004` unsupported operation and `-32009` unsupported version. Inspect the
JSON body even when the transport succeeded. The full
[error reference](https://docs.cascadeauth.com/sidecar/operations/#sidecar-error-reference) covers every
code with its next action, including the authority and recipient refusals
that A2A shares with native delivery.
