# Agent integration

[Understand AAC authority and verification](/overview/).

## Authority, predicates and A2A integration

Native originators call `POST /v1/agent/mint-root` or `/v1/agent/delegations`
on the sidecar's external TLS listener. **Both aliases require the pair's
AAC1-HMAC-SHA256 signature, including in dev mode.** Sign every chain-start request.
Receiving or forwarding applications are not automatically chain-start callers.
The example client below signs its native request with the published helper.

The body contains `human_originator`, configured `class_of_action`, optional
`task_ref`, optional object `payload`, and optional `obligations`, for example:

```json
{"predicate":"amount_max","value":"10000"}
```

Place those predicate/value objects in the `obligations` array. The application
validates the human's login and decides policy, then supplies its result. T0
contains root/identity metadata; T1 carries the first business predicates.
Omitted/empty obligations preserve Mode 0 using class predicates. Equal duplicate
values combine once, differing values within the list or across class/request
are refused, and disjoint predicates combine. There is no override or automatic
ceiling intersection: a dynamic amount normally has one source, the request.

Names must be in the registry below. Values are nonempty strings without comma
or colon; enforced `amount_max`, `amount_min` and `valid_from` also accept JSON
integers and normalize to canonical decimal strings. Booleans, fractions,
malformed integer text and out-of-range values refuse before mint. Keep
predicates compact; put full business reports in your application's storage.
`applied_predicates` reports the accepted limits: static values retain their existing JSON types, obligation values are
strings, and generated `valid_until` is an integer; audience is a separate field.

A top-level request `valid_until` or obligation named `valid_until` always
refuses, even when equal or shorter. Remove it and use the class's configured
`valid_for`. Payload dates remain business data.

Sign uppercase POST, the **exact alias used**, timestamp, exact transmitted raw
body and covered X-AAC headers using the pairing protocol below. Serialize once
and send those bytes; a signature made for the other alias fails. Each auth
header appears exactly once; duplicate covered headers also fail. Send a compact
JSON request with the correct content type. Oversized or malformed requests
are rejected without creating authority.
Missing pairing configuration is 503 `ERR_CONFIG_ERROR`; failed pairing is 401
`ERR_PAIRING_AUTH_FAILED`; invalid native predicates, conflicts or reserved
expiry are 422 `ERR_INVALID_MINT_INPUT`. An invalid issuer retains
its 422 `ERR_INVALID_OIDC_ISSUER` code; ordinary schema errors remain ordinary
422. Selected invalid class predicates are configuration errors (503).

Freshness is an inclusive 30-second window, **not idempotency or one-time chain
creation**. A valid replay can execute mint again; do not automatically retry an
uncertain result. Pure mint returns 200/not_attempted; callback delivery failure
returns 207/failed with already-committed chain provenance. The response does not
turn synthetic human claims into authentication.

If configuration/obligations encode `task_ref`, omitted/null request metadata
inherits it, matching metadata succeeds and disagreement refuses before mint.
Otherwise requested/generated metadata remains metadata and is not silently
added to T1. References used in headers are 1–256 printable ASCII characters.
For signed correlation or convergence, normally supply `task_ref` as a
per-request obligation. A static class value deliberately makes every chain
of that class share a convergence key; it is not a default for independent
runs. Only a signed predicate can key convergent arrival storage. Metadata-only
correlation is not chain-authenticated, and `task_ref` is not an idempotency key.

On native forwarding, explicit destination, additional and composite-attestation
`task_ref` predicates must agree with nonempty workflow correlation. Every branch
is checked before any branch signs or sends. A conflicting receive callback
returns 502 `ERR_INVALID_AGENT_DECISION`; proactive composite returns 400; a
mint callback returns 207/failed because its root is already committed. Prior
buffered arrivals survive refusal; the failed receive's current arrival is
removed. Metadata is never silently signed. If incoming correlation is absent,
an explicitly signed new reference supplies the outgoing header and local audit.

An explicitly authorized separate originator may hold the pair secret only
inside the same trusted tenant-application boundary. It gains callback-signing
capability too; this is not a mint-only credential. Never share across pairs or
tenants. Keep appropriate network/ingress restrictions; the local sample binds
the entire TLS listener to 127.0.0.1. Mode B and a new credential system are not
part of this release.

Agent `/invoke` responses use `AgentDecision`: `forward` supplies a configured
`destination`, payload and optional narrowing `additional_predicates`; `settle`
supplies a settlement ID and action summary; `refuse` supplies a reason. The
sidecar validates the decision, delegates to the destination's exact workload
identity, and signs/verifies the applicable chain and terminal evidence.
Additional predicates narrow existing authority. The example carries the same
`task_ref`, keeps `action: dev_noop`, and shortens validity from ten to five
minutes; it never grants a broader audience or business permission.

The beta's canonical predicate names are:

```text
account, action, amount, amount_max, amount_min, assessed_damage_amount,
assessment_outcome, beneficiary, beneficiary_account, beneficiary_class,
claim_ref, composite_conflict_minerals_clear, composite_esg_scope3_co2e_kg_total,
composite_payout_amount, composite_payout_total, composite_units_total,
conflict_minerals_clear, currency, data_scope, esg_scope3_co2e_kg, hours,
human_authorization_class, max_authority_amount, min_account_age_days,
originator_reference, payout_amount, program_reference, purpose, quantity_units,
reporting_quarter, scope, surveyor_findings, task_ref, unit_price_usd,
valid_from, valid_until
```

Use nonempty scalar values without comma or colon (reserved encoding
separators). `amount_max`, `amount_min`, `valid_from` and `valid_until` use
nonnegative decimal integers;
time values are Unix seconds. A later amount cap cannot increase, an amount
floor or not-before time cannot decrease, and the effective expiry is the
minimum expiry in the chain. External chains require an expiry and have a
maximum 24-hour root-relative lifetime. The agent must still enforce its business
meaning for the other registered fields; a recognized name is not a general
business-policy engine. Unknown predicate names fail closed.

For unary A2A, the paired agent signs `POST /v1/agent/a2a/dispatch` using the
published invoke-auth API. The envelope requires `schema_version`, a UUID
`dispatch_id`, named `destination_profile`, `task_ref`, `authority`,
`additional_predicates`, and `a2a_request`. The demonstrated authority mode is
`originate`; `continue` is reserved for verified inbound authority belonging to
the same pair/task/presenter and its retention window. Never derive continued
authority from caller-supplied identity strings. The external sidecar verifies
AAC/DPoP before forwarding the supported A2A body to the authenticated local
handler. The handler receives verified context rather than raw bearer/DPoP
credentials.

A retry must preserve the dispatch ID and exact envelope. Changed content
under an existing ID is a conflict. An in-progress or outcome-unknown response
is not permission to issue a new ID and repeat a business action: follow the
returned status and reconcile with your operation before retrying. Retain the
bbolt file through process/container replacement for the configured retention
window. Expiry is a bounded guarantee, not permanent deduplication.
### Generate development PKI

**Optional advanced manual recipe.** The preferred [aac init](https://docs.cascadeauth.com/cli/) path generates
or accepts these files for you. This longer recipe belongs only to the optional
hand-built application examples below, not the required onboarding journey.

Use this only for the local development example after registering your tenant
and `spiffe://<trust-domain>/demo/agent` workload. Keep the shell variables from
onboarding. OpenSSL 3.x creates a seven-day development CA and one-day workload,
terminal and localhost TLS certificates, all with distinct keys. Your existing
root-signing key is created separately in the trust-publication step.

The recipe refuses an existing output directory. It never adds the CA to your
system trust store. Run it from the Python environment used for the CLI. It
uses Python's enumerable default CA certificates, falling back to certifi's
public roots (installed with the CLI) if that store is empty. If your network
requires additional private CA certificates, add those trusted PEM certificates
to `outbound-ca.pem` explicitly; do not disable TLS verification.

If saving the block below as a script, first set `AAC_DEMO_DIR` in the calling
shell, for example `export AAC_DEMO_DIR="$HOME/aac-demo/$AAC_PROFILE"`.
Variables exported inside a child script do not persist in its parent shell.

<!-- development-pki-example:start -->
```bash
set -euo pipefail
umask 077
: "${AAC_PROFILE:?Set the profile used for onboarding}"
: "${AAC_TRUST_DOMAIN:?Set your assigned or verified trust domain}"
export AAC_DEMO_DIR="${AAC_DEMO_DIR:-$HOME/aac-demo/$AAC_PROFILE}"
export AAC_DEMO_SPIFFE_ID="spiffe://${AAC_TRUST_DOMAIN}/demo/agent"
python - <<'PY'
import os, re, ssl
import certifi
domain = os.environ['AAC_TRUST_DOMAIN']
if not re.fullmatch(r'[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?', domain):
    raise SystemExit('Use your canonical lowercase trust domain')
roots = ssl.create_default_context().get_ca_certs(binary_form=True)
if not roots:
    roots = ssl.create_default_context(cafile=certifi.where()).get_ca_certs(binary_form=True)
if not roots:
    raise SystemExit('No public CA roots; repair the CLI environment/certifi installation')
PY
test ! -e "$AAC_DEMO_DIR"
mkdir -p "$(dirname "$AAC_DEMO_DIR")"
mkdir "$AAC_DEMO_DIR"
mkdir "$AAC_DEMO_DIR/pki" "$AAC_DEMO_DIR/state" "$AAC_DEMO_DIR/publish-ca"
cd "$AAC_DEMO_DIR/pki"
openssl genpkey -algorithm ed25519 -out dev-ca.key
openssl req -new -x509 -key dev-ca.key -out dev-ca.crt -days 7 \
  -subj '/CN=AAC local development CA' \
  -addext 'basicConstraints=critical,CA:TRUE,pathlen:0' \
  -addext 'keyUsage=critical,keyCertSign,cRLSign' \
  -addext 'subjectKeyIdentifier=hash'
cat > identity.ext <<EOF
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=clientAuth,serverAuth
subjectAltName=critical,URI:${AAC_DEMO_SPIFFE_ID}
EOF
for purpose in workload terminal; do
  openssl genpkey -algorithm ed25519 -out "$purpose.key"
  openssl req -new -key "$purpose.key" -out "$purpose.csr" -subj '/'
  openssl x509 -req -in "$purpose.csr" -CA dev-ca.crt -CAkey dev-ca.key \
    -set_serial "0x$(openssl rand -hex 16)" -days 1 \
    -extfile identity.ext -out "$purpose.crt"
done
openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out server.key
openssl req -new -key server.key -out server.csr -subj '/CN=localhost'
cat > server.ext <<'EOF'
basicConstraints=critical,CA:FALSE
keyUsage=critical,digitalSignature
extendedKeyUsage=serverAuth
subjectAltName=IP:127.0.0.1,DNS:localhost
EOF
openssl x509 -req -in server.csr -CA dev-ca.crt -CAkey dev-ca.key \
  -set_serial "0x$(openssl rand -hex 16)" -days 1 -extfile server.ext -out server.crt
openssl verify -CAfile dev-ca.crt workload.crt terminal.crt server.crt
openssl rand -hex 32 > pairing.secret
cp dev-ca.crt "$AAC_DEMO_DIR/publish-ca/local-demo.ca.pem"
python - <<'PY'
from pathlib import Path
import ssl
import certifi
roots = ssl.create_default_context().get_ca_certs(binary_form=True)
if not roots:
    roots = ssl.create_default_context(cafile=certifi.where()).get_ca_certs(binary_form=True)
if not roots:
    raise SystemExit('No public CA roots; repair the CLI environment/certifi installation')
public_roots = ''.join(ssl.DER_cert_to_PEM_cert(cert) for cert in roots)
Path('outbound-ca.pem').write_text(Path('dev-ca.crt').read_text() + public_roots)
PY
chmod 600 ./*
cd "$AAC_DEMO_DIR"
```
<!-- development-pki-example:end -->

Publish only `publish-ca/local-demo.ca.pem` using the SPIFFE publication
instructions below. Keep `pki/dev-ca.key` with the operator; mount only the
workload, terminal and TLS keys into the sidecar. The peer trusts the published
CA; the paired application receives only `pairing.secret`.

Check expiry before each later run with `openssl x509 -in
"$AAC_DEMO_DIR/pki/workload.crt" -noout -dates`. Reissue matching leaf
certificates before they expire, using the same tenant-approved issuer, or
create a new development directory and deliberately update your trust/config.
Do not overwrite keys or remove old trust while a workload still uses it.
The OpenSSL [certificate request](https://docs.openssl.org/3.6/man1/openssl-req/)
and [certificate signing](https://docs.openssl.org/3.6/man1/openssl-x509/)
references describe the commands used here.


## Optional runnable paired-agent example

Use this synthetic example with a **prepared test tenant** and the sidecar
configuration below. It performs no payment, trade, or other business action.
Its human-originator fields are explicitly synthetic input, not proof of a
GitHub, Google, or other identity-provider sign-in. A real originator must take
those fields from its authenticated application context.

This example uses a small Python/FastAPI application. If you already have an
agent, integrate pairing authentication into its existing handler and server.

### Install the optional sample application server

In the same virtual environment used for the
[deployment reference's companion tools](https://docs.cascadeauth.com/sidecar/configuration/#companion-developer-tools):

```bash
python -m pip install --upgrade uvicorn httpx PyYAML
```

Uvicorn serves the example FastAPI application over local HTTP; HTTPX sends the
example client requests. Install these only when running this Python example.
PyYAML writes the complete example configuration below.

### Replay protection profiles

The template selects **Basic**: `backend: memory`, `deployment_profile: basic`.
It works with `sidecar.dev_mode: false` and does not relax pairing, loopback,
trust, projection, signatures, proof time or presenter/recipient checks.
Existing configurations are not silently converted. Bare memory without a
profile remains development-only and is reported as `development-memory`.

| Profile | Replay history and requirements |
|---|---|
| Basic | Bounded process-local memory; one atomic claim per running history. Restart loses history; replicas do not coordinate |
| Shared durable | `backend: valkey`, `deployment_profile: ha-retained-write-safe`; existing qualified retained-write-safe authority, authenticated TLS and workload-scoped credentials. Retained claims coordinate replicas of the exact receiver SPIFFE identity |

Shared durable failures never fall back to Basic. Choose one of the supported
profiles above; neither changes the developer-beta license or support terms.

Basic keeps replay records until they expire; it does not discard them to make
room for new traffic. Duplicate proofs return 403 `ERR_DPOP_REPLAY`. Full
storage returns 503 `ERR_REPLAY_AUTHORITY_SATURATED`; reduce admitted traffic
or wait for records to expire. An unavailable replay store returns 503
`ERR_REPLAY_AUTHORITY_UNAVAILABLE`. Check `/readyz` for the selected
`replay_backend` and `replay_profile` when diagnosing the deployment.

For Basic, `replay_protection.memory_max_entries` controls capacity. Size it for
your expected concurrent replay records, including traffic bursts and requests
that later fail authorization. A capacity refusal means you should reduce
admitted traffic or increase capacity within your host's available memory.

A still-valid proof can pass replay checking again after a Basic restart or on
another replica. Choose Shared durable when replay history must survive
replacement or coordinate replicas. Your application must still prevent repeat
business actions; a fresh proof does not make an operation safe to repeat.
Keep clocks synchronized.

#### Operator-led cutover to Shared durable

1. Close protected admission to **every** Basic instance for the receiving
   workload. Drain in-flight operations, stop those instances, and prevent any
   old instance from rejoining. Record the final drain time.
2. Configure every replacement for the same qualified Shared durable workload
   namespace and its scoped credentials. Preserve retained shared records and
   other workloads' state.
3. Hold admission closed for **at least 120 full seconds after the last Basic
   instance drains**. Verify synchronized/non-regressing clocks and that the
   latest possible Basic proof expiry has passed at every replacement verifier.
   Extend the hold for clock uncertainty; measure the interval independently
   of wall-clock jumps.
4. Complete shared readiness/quarantine checks and an authenticated validation
   workflow, then reopen admission only to Shared durable instances.

A fresh Valkey epoch supplies the hold only if its **entire interval** is
verified to follow the last Basic drain. An already initialized epoch can be
ready immediately; restarting a sidecar does not reset it. Readiness alone
never replaces the hold. Do not delete/reset shared state to manufacture a
timer. There is no automatic migration engine, Basic startup quarantine,
seamless cutover or automatic downgrade.

### Create the complete local configuration

Use the development PKI above, your registered tenant/workload and the root key
published in the trust-publication step. Keep `AAC_TENANT_ID`,
`AAC_TRUST_DOMAIN`, `AAC_MATERIAL_DIR` and `AAC_DEMO_DIR` in your shell.
The CLI stores the bare API-key string at `~/.aac/credentials/<tenant-id>`;
its `.session` sibling is different and must not be used here. For a key kept
elsewhere, set `AAC_API_KEY_FILE` to the protected file containing just that key.

Save this as `configure_demo.py` in your development directory. It writes an
entire `sidecar-config.yaml`; no template overlay or manual merging is needed.
Existing configurations are never overwritten. All listeners stay on localhost.
This local example selects Basic replay explicitly; its small retained
A2A-state limits are example sizing. Basic selection is independent of
development mode, which remains enabled for the local fixture posture.

<!-- local-config-example:start -->
```python
import os
import re
from pathlib import Path
import yaml

os.umask(0o077)
base = Path(os.environ["AAC_DEMO_DIR"]).expanduser().resolve()
onboarding = Path(os.environ["AAC_MATERIAL_DIR"]).expanduser().resolve()
tenant = os.environ["AAC_TENANT_ID"]
domain = os.environ["AAC_TRUST_DOMAIN"]
if not re.fullmatch(r"tnt-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}", tenant):
    raise SystemExit("Use the tenant ID returned by registration")
if not re.fullmatch(r"[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?", domain):
    raise SystemExit("Use your assigned or verified lowercase trust domain")
spiffe = f"spiffe://{domain}/demo/agent"
key_id = os.environ.get("AAC_ROOT_KEY_ID", "demo-root-v1")
root_key = onboarding / (key_id + ".pem")
api_key = (
    Path(os.environ.get("AAC_API_KEY_FILE", str(Path.home() / ".aac/credentials" / tenant)))
    .expanduser()
    .resolve()
)
pki = base / "pki"
required = [
    root_key,
    api_key,
    *[
        pki / name
        for name in (
            "workload.key",
            "workload.crt",
            "terminal.key",
            "terminal.crt",
            "server.key",
            "server.crt",
            "outbound-ca.pem",
            "pairing.secret",
        )
    ],
]
if any(not p.is_file() or not p.stat().st_size for p in required):
    raise SystemExit("Prepare every credential file before creating the configuration")
if not (base / "state").is_dir():
    raise SystemExit("Run development PKI setup first")
config = {
    "schema_version": "1.0",
    "replay_protection": {
        "backend": "memory",
        "deployment_profile": "basic",
        "memory_max_entries": 100000,
    },
    "sidecar": {
        "dev_mode": True,
        "loopback_bind_address": "127.0.0.1",
        "loopback_port": 8080,
        "external_bind_address": "127.0.0.1",
        "external_port": 9443,
        "agent_invoke_url": "http://127.0.0.1:8000/invoke",
        "agent_invoke_auth": {"secret_file": str(pki / "pairing.secret")},
        "tls_cert_file": str(pki / "server.crt"),
        "tls_key_file": str(pki / "server.key"),
        "tls_ca_file": str(pki / "outbound-ca.pem"),
        "log_level": "info",
        "telemetry": {"sink": str(base / "state/telemetry.jsonl")},
    },
    "tenant": {
        "id": tenant,
        "key_id": key_id,
        "signing_key_file": str(root_key),
        "signing_key_algorithm": "ed25519",
    },
    "agent": {
        "spiffe_id": spiffe,
        "svid_key_file": str(pki / "workload.key"),
        "svid_cert_file": str(pki / "workload.crt"),
        "attestation_key_file": str(pki / "terminal.key"),
        "attestation_cert_file": str(pki / "terminal.crt"),
    },
    "trust_anchors": {
        "source": "control_plane",
        "control_plane_url": "https://trust.stage.cascadeauth.dev",
        "tenant_ids": [tenant],
    },
    "spiffe_bundles": {
        "source": "control_plane",
        "control_plane_url": "https://trust.stage.cascadeauth.dev",
        "trust_domains": [domain],
    },
    "workload_projection": {
        "source": "control_plane",
        "control_plane_url": "https://api.stage.cascadeauth.dev",
        "api_key_file": str(api_key),
    },
    "a2a": {
        "public_base_url": "https://127.0.0.1:9443",
        "local_handler_url": "http://127.0.0.1:8000/a2a/v1",
        "max_request_body_bytes": 262144,
        "deadline_seconds": 60,
        "max_concurrent_requests": 20,
        "max_json_nesting_depth": 32,
        "max_json_nodes": 10000,
        "continuation_authority": {"retention_seconds": 600},
        "egress_idempotency": {
            "state_file": str(base / "state/a2a-egress.db"),
            "retention_seconds": 86400,
            "max_entries_per_pair": 4096,
            "max_cached_response_body_bytes": 4096,
            "max_reserved_cached_bytes_per_pair": 16777216,
        },
    },
    "classes_of_action": {
        "demo_verify": {
            "predicates": {"action": "dev_noop"},
            "valid_for": "+10m",
            "audience_self": spiffe,
        }
    },
    "destinations": {
        name: {
            "url": "https://127.0.0.1:9443" + path,
            "audience_pattern": spiffe,
            "predicates": {"action": "dev_noop"},
            "valid_for": "+5m",
            "timeout_ms": 10000,
        }
        for name, path in [("self_receive", "/v1/agent/receive"), ("self_a2a", "/a2a/v1")]
    },
}
with (base / "sidecar-config.yaml").open("x") as stream:
    yaml.safe_dump(config, stream, sort_keys=False)
print("Created complete configuration:", base / "sidecar-config.yaml")
```
<!-- local-config-example:end -->

```bash
cd "$AAC_DEMO_DIR"
python configure_demo.py
```

Confirm that your root key and development CA are visible at the public trust
URLs before starting. Keep this setup local; a real deployment needs managed
certificates, an explicitly chosen replay profile, qualified A2A storage and restricted ingress.


### Save and start the agent

Save the following as `agent.py`. Set `AAC_INVOKE_AUTH_SECRET_FILE` to the
per-pair secret mounted in your agent; the sidecar's
`sidecar.agent_invoke_auth.secret_file` must read the same bytes. Keep the file
private and do not disable authentication.

<!-- paired-agent-example:start -->
```python
from fastapi import FastAPI, Request
import os
from aac_invoke_auth.fastapi import InvokeAuthGuard, InvokeAuthMiddleware

app = FastAPI()
app.add_middleware(
    InvokeAuthMiddleware,
    guard=InvokeAuthGuard.from_env(),
    protected_paths=("/invoke", "/a2a/v1"),
)


def sample_decision(body):
    payload = body.get("current_arrival", {}).get("payload", {})
    if isinstance(payload, dict) and payload.get("step") == "forward":
        return {
            "action": "forward",
            "destination": os.environ.get("AAC_DEMO_DESTINATION", "self_receive"),
            "payload": {"step": "settle"},
            "additional_predicates": {"task_ref": body["task_ref"]},
        }
    if isinstance(payload, dict) and payload.get("step") == "settle":
        return {
            "action": "settle",
            "settlement_id": body["task_ref"],
            "action_summary": "Completed synthetic demonstration; no business effect.",
        }
    return {"action": "refuse", "reason": "Demo agent has no other business policy."}


@app.post("/invoke")
async def invoke(request: Request):
    return sample_decision(await request.json())


@app.post("/a2a/v1")
async def a2a(request: Request):
    body = await request.json()
    # The sidecar admits only the supported unary SendMessage profile here.
    return {
        "jsonrpc": "2.0",
        "id": body["id"],
        "result": {
            "message": {
                "messageId": body["params"]["message"]["messageId"] + "-reply",
                "contextId": "demo-" + body["params"]["message"]["messageId"],
                "role": "ROLE_AGENT",
                "parts": [{"text": "Synthetic AAC-authorized reply"}],
            }
        },
    }
```
<!-- paired-agent-example:end -->

Save the client below too, then choose the Docker or standalone start instructions.
An unsigned direct POST to `/invoke` must return 401; the same applies to `/a2a/v1`.
Missing pairing configuration prevents agent startup.

### Save and run the client

Save this as `demo_client.py`. Run it only in the same trusted local network
namespace as the sidecar. It sends mint requests to the locally bound TLS listener on port 9443 and
A2A dispatch to loopback port 8080.

<!-- paired-client-example:start -->
```python
import json
import os
import ssl
import time
import uuid
from pathlib import Path

import httpx
from aac_invoke_auth import sign_invoke_request


def run_demo(client, secret, originator, destination_profile="self_a2a"):
    task = "demo-" + str(uuid.uuid4())
    human = {
        "iss": "https://synthetic.invalid",
        "sub": "demo-only",
        "auth_time_unix_seconds": int(time.time()),
    }
    path = "/v1/agent/mint-root"
    body = json.dumps(
        {
            "human_originator": human,
            "class_of_action": "demo_verify",
            "task_ref": task,
            "payload": {"step": "forward"},
        },
        separators=(",", ":"),
    ).encode()
    headers = {"Content-Type": "application/json"}
    headers.update(
        sign_invoke_request(secret=secret, method="POST", path=path, headers=headers, body=body)
    )
    response = originator.post(path, headers=headers, content=body)
    response.raise_for_status()
    minted = response.json()
    if minted.get("delivery_status") != "delivered":
        raise RuntimeError("native workflow was not delivered")

    path = "/v1/agent/a2a/dispatch"
    dispatch_id = str(uuid.uuid4())
    envelope = {
        "schema_version": "aac.a2a.egress.v1",
        "dispatch_id": dispatch_id,
        "destination_profile": destination_profile,
        "task_ref": task + "-a2a",
        "authority": {
            "mode": "originate",
            "class_of_action": "demo_verify",
            "human_originator": human,
        },
        "additional_predicates": {},
        "a2a_request": {
            "jsonrpc": "2.0",
            "id": task,
            "method": "SendMessage",
            "params": {
                "message": {
                    "messageId": str(uuid.uuid4()),
                    "role": "ROLE_USER",
                    "parts": [{"text": "Synthetic hello"}],
                }
            },
        },
    }
    body = json.dumps(envelope, separators=(",", ":")).encode()

    def send():
        headers = {"Content-Type": "application/json", "X-AAC-Envelope-Schema": "aac.a2a.egress.v1"}
        headers.update(
            sign_invoke_request(secret=secret, method="POST", path=path, headers=headers, body=body)
        )
        result = client.post(path, headers=headers, content=body)
        result.raise_for_status()
        if "error" in result.json():
            raise RuntimeError("A2A returned a protocol error")
        return result

    first = send()
    retry = send()  # Same dispatch_id AND same envelope; fresh pairing signature.
    if retry.content != first.content:
        raise RuntimeError("identical A2A retry returned different bytes")
    return {
        "native_delivery": "delivered",
        "task_ref": task,
        "root_token_id": minted["root_token_id"],
        "a2a_dispatch_id": dispatch_id,
        "a2a_retry": "same response bytes",
    }


if __name__ == "__main__":
    secret = Path(os.environ["AAC_INVOKE_AUTH_SECRET_FILE"]).read_bytes().strip()
    tls = ssl.create_default_context(cafile=os.environ["AAC_DEMO_CA_FILE"])
    with httpx.Client(base_url="http://127.0.0.1:8080", timeout=65, trust_env=False) as client:
        with httpx.Client(
            base_url="https://127.0.0.1:9443", verify=tls, timeout=65, trust_env=False
        ) as originator:
            print(
                json.dumps(
                    run_demo(
                        client,
                        secret,
                        originator,
                        os.environ.get("AAC_DEMO_A2A_DESTINATION", "self_a2a"),
                    ),
                    indent=2,
                )
            )
```
<!-- paired-client-example:end -->

### Run the example with Docker

This is the default container path; it does not require ORAS or a standalone
sidecar. Save `agent.py`, `demo_client.py` and the complete configuration above
in `AAC_DEMO_DIR`. Run this staging helper as `configure_container.py`. It copies
only the selected runtime files into a new `container/` directory and refuses
to overwrite it. The development CA private key stays outside that directory.

<!-- container-config-example:start -->
```python
import os
from pathlib import Path
import shutil
import yaml

os.umask(0o077)
base = Path(os.environ["AAC_DEMO_DIR"]).expanduser().resolve()
config = yaml.safe_load((base / "sidecar-config.yaml").read_text())
for name in ("agent.py", "demo_client.py"):
    if not (base / name).is_file():
        raise SystemExit("Save both example applications before staging")
stage = base / "container"
stage.mkdir()
for name in ("sidecar", "agent", "pair", "state"):
    (stage / name).mkdir()


def stage_key(source, name):
    shutil.copyfile(source, stage / "sidecar" / name)
    return "/etc/aac/" + name


config["tenant"]["signing_key_file"] = stage_key(config["tenant"]["signing_key_file"], "root.pem")
for field, name in [
    ("svid_key_file", "workload.key"),
    ("svid_cert_file", "workload.crt"),
    ("attestation_key_file", "terminal.key"),
    ("attestation_cert_file", "terminal.crt"),
]:
    config["agent"][field] = stage_key(config["agent"][field], name)
for field, name in [
    ("tls_key_file", "server.key"),
    ("tls_cert_file", "server.crt"),
    ("tls_ca_file", "outbound-ca.pem"),
]:
    config["sidecar"][field] = stage_key(config["sidecar"][field], name)
config["workload_projection"]["api_key_file"] = stage_key(
    config["workload_projection"]["api_key_file"], "tenant-api-key"
)
shutil.copyfile(base / "pki/pairing.secret", stage / "pair/pairing.secret")
shutil.copyfile(base / "pki/dev-ca.crt", stage / "pair/dev-ca.crt")
config["sidecar"]["agent_invoke_auth"]["secret_file"] = "/run/secrets/pairing.secret"
config["sidecar"]["telemetry"]["sink"] = "/var/lib/aac/telemetry.jsonl"
config["a2a"]["egress_idempotency"]["state_file"] = "/var/lib/aac/a2a-egress.db"
(stage / "sidecar/sidecar-config.yaml").write_text(yaml.safe_dump(config, sort_keys=False))
for name in ("agent.py", "demo_client.py"):
    shutil.copyfile(base / name, stage / "agent" / name)
(stage / "agent/Dockerfile").write_text("""FROM python:3.12-slim
RUN python -m pip install --no-cache-dir aac-invoke-auth[fastapi] uvicorn httpx
WORKDIR /app
COPY agent.py demo_client.py /app/
RUN chmod 0444 /app/*.py
ENV PYTHONDONTWRITEBYTECODE=1
USER 65532:65532
CMD ["python", "-m", "uvicorn", "agent:app", "--host", "127.0.0.1", "--port", "8000"]
""")
print("Created container configuration and sample application build directory")
```
<!-- container-config-example:end -->

Build the sample **application** image locally and pull the published sidecar:

```bash
cd "$AAC_DEMO_DIR"
python configure_container.py
docker build --tag aac-demo-agent "$AAC_DEMO_DIR/container/agent"
docker pull docker.io/cascadeauth/aac-sidecar:v0.5.0
```

Run from a non-root host account. This local demonstration runs both containers
with your numeric UID/GID so their staged private files can remain mode 0600;
managed deployments normally provision permissions for the image's default
65532 user. The two containers share one network namespace. No ports are
published; the client runs inside that namespace too.

```bash
test "$(id -u)" -ne 0
docker run --detach --name aac-demo-agent --user "$(id -u):$(id -g)" \
  --read-only --cap-drop ALL --security-opt no-new-privileges --tmpfs /tmp \
  --mount "type=bind,src=${AAC_DEMO_DIR}/container/pair,dst=/run/secrets,readonly" \
  --env AAC_INVOKE_AUTH_SECRET_FILE=/run/secrets/pairing.secret \
  --env AAC_DEMO_CA_FILE=/run/secrets/dev-ca.crt aac-demo-agent
docker run --detach --name aac-demo-sidecar --user "$(id -u):$(id -g)" \
  --network container:aac-demo-agent --read-only --cap-drop ALL --security-opt no-new-privileges \
  --mount "type=bind,src=${AAC_DEMO_DIR}/container/sidecar,dst=/etc/aac,readonly" \
  --mount "type=bind,src=${AAC_DEMO_DIR}/container/pair,dst=/run/secrets,readonly" \
  --mount "type=bind,src=${AAC_DEMO_DIR}/container/state,dst=/var/lib/aac" \
  docker.io/cascadeauth/aac-sidecar:v0.5.0 -config /etc/aac/sidecar-config.yaml
docker logs --tail 30 aac-demo-agent
docker logs --tail 30 aac-demo-sidecar
docker exec aac-demo-agent \
  python -c 'import urllib.request
print(urllib.request.urlopen("http://127.0.0.1:8080/readyz").read().decode())'
docker exec aac-demo-agent python /app/demo_client.py
```

Allow startup and the initial trust refresh to finish. Readiness checks replay;
the authenticated example checks trust and pairing. Read local evidence in
`container/state/telemetry.jsonl`. After the exercise, stop/remove only these
two example containers; retain the private staging/state directory according
to your test policy:

```bash
docker stop aac-demo-sidecar aac-demo-agent
docker rm aac-demo-sidecar aac-demo-agent
```

### Run the example with a standalone sidecar

Use this alternative if you installed the standalone binary. In new terminals,
activate the same Python environment and set `AAC_DEMO_DIR` to the directory
created during setup. Start the agent, then the sidecar:

```bash
cd "$AAC_DEMO_DIR"
export AAC_INVOKE_AUTH_SECRET_FILE="$AAC_DEMO_DIR/pki/pairing.secret"
python -m uvicorn agent:app --host 127.0.0.1 --port 8000
```

```bash
"$HOME/.local/bin/aac-sidecar" -config "$AAC_DEMO_DIR/sidecar-config.yaml"
```

From another activated terminal, check readiness and run the client:

```bash
cd "$AAC_DEMO_DIR"
export AAC_INVOKE_AUTH_SECRET_FILE="$AAC_DEMO_DIR/pki/pairing.secret"
export AAC_DEMO_CA_FILE="$AAC_DEMO_DIR/pki/outbound-ca.pem"
curl --fail --silent --show-error http://127.0.0.1:8080/readyz
python demo_client.py
```

The client prints only correlation identifiers and outcomes. The native chain
mints a root and initial holder authority, invokes the agent, forwards to
`self_receive` with the same task restriction, then settles with a signed
terminal attestation. The separate A2A call returns the sample reply; its identical
retry uses the retained result rather than repeating the operation.

A successful HTTP response is only part of the evidence. Match the returned
`root_token_id` in the local telemetry file and check the mint, dispatch,
receive and terminal `respond` events. The terminal attestation stays local;
central trace forwarding deliberately excludes it. If forwarding is enabled,
use `aac chain show --help` to inspect the same root's central metadata after
allowing for asynchronous delivery. Record sanitized outcomes, never raw
credentials, private payloads, SVIDs with private keys or complete logs.

For a cross-tenant test, replace the self destinations with your explicitly
registered peer's final URL and exact SPIFFE ID, include both tenants' public
root keys and trust domains, and agree on predicates with that peer. Never
point this no-policy demo at a real business handler.
## Work through two agents

For two independently registered tenants with separate CAs and the CLI-managed
lifecycle, use the [Compose reservation demo](https://github.com/CascadeAuth/aac-compose-demo).
The standalone example below remains a lower-level same-tenant reference.

Use the standalone installation for this optional multi-process example.
It is separate from the Docker path above. This example runs Agent A and Agent B as separate local processes in
the same test tenant. It uses your existing development CA and published root;
no CA private key is sent to an agent or peer. First stop the single-agent
example's processes. Keep its files and retained state.

Register the second workload, then install the helper's local dependencies:

```bash
aac tenant add-workload --profile "$AAC_PROFILE" \
  --spiffe-id "spiffe://${AAC_TRUST_DOMAIN}/demo/peer" --display-name 'Synthetic peer agent'
python -m pip install --upgrade cryptography PyYAML
```

Save the following as `configure_peer.py` in `AAC_DEMO_DIR`. It creates fresh,
distinct peer keys/certificates and pairing secret, two complete configurations,
and separate retained-state paths. It refuses existing peer output. It uses
the development CA for at most one-day leaf validity, bounded by CA expiry.

<!-- two-agent-example:start -->
```python
import copy
import datetime as dt
import ipaddress
import os
from pathlib import Path
import secrets
import yaml
from cryptography import x509
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec, ed25519
from cryptography.x509.oid import ExtendedKeyUsageOID, NameOID

os.umask(0o077)
base = Path(os.environ["AAC_DEMO_DIR"]).expanduser().resolve()
config = yaml.safe_load((base / "sidecar-config.yaml").read_text())
domain = config["agent"]["spiffe_id"].split("/")[2]
peer_spiffe = f"spiffe://{domain}/demo/peer"
ca = x509.load_pem_x509_certificate((base / "pki/dev-ca.crt").read_bytes())
ca_key = serialization.load_pem_private_key((base / "pki/dev-ca.key").read_bytes(), None)
now = dt.datetime.now(dt.timezone.utc)
if not isinstance(
    ca_key, ed25519.Ed25519PrivateKey
) or ca.not_valid_after_utc <= now + dt.timedelta(hours=1):
    raise SystemExit("Use a currently valid CA from the development PKI recipe")
public_bytes = lambda key: key.public_bytes(
    serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo
)
if (
    public_bytes(ca_key.public_key()) != public_bytes(ca.public_key())
    or ca.not_valid_before_utc > now
):
    raise SystemExit("Development CA certificate/key mismatch or CA is not yet valid")
if (base / "sidecar-A.yaml").exists() or (base / "peer").exists():
    raise SystemExit("Peer configuration already exists; inspect it before changing it")
peer = base / "peer"
peer.mkdir()
(peer / "pki").mkdir()
(peer / "state").mkdir()


def issue(name, identity=None):
    key = (
        ed25519.Ed25519PrivateKey.generate()
        if identity and name == "workload"
        else ec.generate_private_key(ec.SECP256R1())
    )
    subject = (
        x509.Name([])
        if identity
        else x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, "localhost")])
    )
    sans = (
        [x509.UniformResourceIdentifier(identity)]
        if identity
        else [x509.IPAddress(ipaddress.ip_address("127.0.0.1")), x509.DNSName("localhost")]
    )
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(ca.subject)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(now - dt.timedelta(seconds=5))
        .not_valid_after(min(now + dt.timedelta(days=1), ca.not_valid_after_utc))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(
            x509.KeyUsage(True, False, False, False, False, False, False, False, False),
            critical=True,
        )
        .add_extension(
            x509.ExtendedKeyUsage(
                [ExtendedKeyUsageOID.CLIENT_AUTH, ExtendedKeyUsageOID.SERVER_AUTH]
                if identity
                else [ExtendedKeyUsageOID.SERVER_AUTH]
            ),
            critical=False,
        )
        .add_extension(x509.SubjectAlternativeName(sans), critical=bool(identity))
        .sign(ca_key, None)
    )
    (peer / "pki" / f"{name}.key").write_bytes(
        key.private_bytes(
            serialization.Encoding.PEM,
            serialization.PrivateFormat.PKCS8,
            serialization.NoEncryption(),
        )
    )
    (peer / "pki" / f"{name}.crt").write_bytes(cert.public_bytes(serialization.Encoding.PEM))


issue("workload", peer_spiffe)
issue("terminal", peer_spiffe)
issue("server")
(peer / "pki/pairing.secret").write_text(secrets.token_hex(32) + "\n")
(peer / "pki/outbound-ca.pem").write_bytes((base / "pki/outbound-ca.pem").read_bytes())
(peer / "pki/dev-ca.crt").write_bytes((base / "pki/dev-ca.crt").read_bytes())
sender, receiver = copy.deepcopy(config), copy.deepcopy(config)
sender["sidecar"]["telemetry"]["sink"] = str(base / "state/telemetry-A.jsonl")
sender["a2a"]["egress_idempotency"]["state_file"] = str(base / "state/a2a-egress-A.db")
sender["destinations"] = {
    name: {
        "url": "https://127.0.0.1:9444" + path,
        "audience_pattern": peer_spiffe,
        "predicates": {"action": "dev_noop"},
        "valid_for": "+5m",
        "timeout_ms": 10000,
    }
    for name, path in [("peer_receive", "/v1/agent/receive"), ("peer_a2a", "/a2a/v1")]
}
receiver["tenant"].pop("signing_key_file")
receiver["agent"].update(
    spiffe_id=peer_spiffe,
    svid_key_file=str(peer / "pki/workload.key"),
    svid_cert_file=str(peer / "pki/workload.crt"),
    attestation_key_file=str(peer / "pki/terminal.key"),
    attestation_cert_file=str(peer / "pki/terminal.crt"),
)
receiver["sidecar"].update(
    loopback_port=8081,
    external_port=9444,
    agent_invoke_url="http://127.0.0.1:8001/invoke",
    agent_invoke_auth={"secret_file": str(peer / "pki/pairing.secret")},
    tls_cert_file=str(peer / "pki/server.crt"),
    tls_key_file=str(peer / "pki/server.key"),
    tls_ca_file=str(peer / "pki/outbound-ca.pem"),
    telemetry={"sink": str(peer / "state/telemetry-B.jsonl")},
)
receiver["a2a"].update(
    public_base_url="https://127.0.0.1:9444", local_handler_url="http://127.0.0.1:8001/a2a/v1"
)
receiver["a2a"]["egress_idempotency"]["state_file"] = str(peer / "state/a2a-egress.db")
receiver["classes_of_action"] = {}
receiver["destinations"] = {}
with (base / "sidecar-A.yaml").open("x") as f:
    yaml.safe_dump(sender, f, sort_keys=False)
with (peer / "sidecar-B.yaml").open("x") as f:
    yaml.safe_dump(receiver, f, sort_keys=False)
print("Created sidecar-A.yaml and peer/sidecar-B.yaml")
```
<!-- two-agent-example:end -->

```bash
cd "$AAC_DEMO_DIR"
python configure_peer.py
```

Use four terminals, with the same Python environment active and `AAC_DEMO_DIR`
set to the absolute directory from setup. Run one of these commands in each:

```bash
cd "$AAC_DEMO_DIR"
AAC_INVOKE_AUTH_SECRET_FILE="$AAC_DEMO_DIR/pki/pairing.secret" AAC_DEMO_DESTINATION=peer_receive \
  python -m uvicorn agent:app --host 127.0.0.1 --port 8000
```

```bash
cd "$AAC_DEMO_DIR"
AAC_INVOKE_AUTH_SECRET_FILE="$AAC_DEMO_DIR/peer/pki/pairing.secret" \
  python -m uvicorn agent:app --host 127.0.0.1 --port 8001
```

```bash
"$HOME/.local/bin/aac-sidecar" -config "$AAC_DEMO_DIR/sidecar-A.yaml"
```

```bash
"$HOME/.local/bin/aac-sidecar" -config "$AAC_DEMO_DIR/peer/sidecar-B.yaml"
```

Check readiness at `http://127.0.0.1:8080/readyz` and
`http://127.0.0.1:8081/readyz`, then run the client in a fifth terminal:

```bash
cd "$AAC_DEMO_DIR"
AAC_INVOKE_AUTH_SECRET_FILE="$AAC_DEMO_DIR/pki/pairing.secret" \
AAC_DEMO_CA_FILE="$AAC_DEMO_DIR/pki/outbound-ca.pem" AAC_DEMO_A2A_DESTINATION=peer_a2a \
  python demo_client.py
```

Agent A forwards the native task to `peer_receive`; Sidecar B verifies it and
Agent B settles. The A2A operation goes to `peer_a2a`; its repeated dispatch uses
the stored response. Correlate `state/telemetry-A.jsonl` with
`peer/state/telemetry-B.jsonl` and verify B's terminal certificate/attestation
using B's registered identity. Stop these four owned processes when finished;
retain the state and private material according to your test-tenant policy.

For separate hosts or tenants, replace localhost with restricted HTTPS ingress
and use independently provisioned credentials on each side. Each receiver must
trust the originator root tenant via `trust_anchors.tenant_ids` and the presenter
CA domain via `spiffe_bundles.trust_domains`; use authenticated workload
projection for the presenting and terminal identities. The sender's destination
must name the peer's exact SPIFFE ID. Do not copy a CA private key or another
workload's private keys between those hosts.
## Pairing authentication for any language

Implement `AAC1-HMAC-SHA256` before trusting a sidecar's `/invoke` or `/a2a/v1`
callback. A paired agent also uses it to call `/v1/agent/a2a/dispatch` on the
sidecar's loopback listener. It is separate from the AAC-chain/DPoP verification
between sidecars. No Python package is required by another language.

1. Read the per-pair secret file as opaque bytes, removing surrounding ASCII
   whitespace. Use at least 32 secret bytes. The recommended `openssl rand -hex
   32` produces 64 ASCII bytes: **do not hex-decode those characters**.
2. Preserve the exact request-body bytes. Compute their SHA-256 and encode it
   as 64 lowercase hexadecimal characters. Do not parse/reserialize the body
   between signing and sending or verifying.
3. Select every header whose lowercase name starts with `x-aac-`, excluding
   `x-aac-invoke-signature` and `x-aac-invoke-timestamp`. Reject duplicate covered
   names, including duplicates that differ only by case. Lowercase names,
   preserve their received values, sort by name, and join `name:value` lines
   with LF (`\n`). Do not add a trailing LF to this header block.
4. Join the following six strings with LF, encoded as UTF-8:

```text
AAC1-HMAC-SHA256
UPPERCASE_HTTP_METHOD
REQUEST_PATH
DECIMAL_UNIX_SECONDS
LOWERCASE_HEX_SHA256_OF_BODY
SORTED_COVERED_HEADER_BLOCK
```

`REQUEST_PATH` is the endpoint path, such as `/invoke`, not a full URL. These
paired endpoints use no query string. The final block may contain multiple
lines. If it is empty, the canonical string ends in the LF separating it from
the body digest; otherwise there is no final LF. Ordinary headers such as
`Content-Type` are not covered. Add no spaces around `:` in covered lines.

5. Compute HMAC-SHA256 of that complete string using the secret bytes. Send:
   `X-AAC-Invoke-Timestamp: <decimal seconds>` and
   `X-AAC-Invoke-Signature: AAC1-HMAC-SHA256 <lowercase hex HMAC>`.
6. The receiver requires exactly one timestamp and signature, the supported
   algorithm, a timestamp within **30 seconds before or after its clock**, and
   a constant-time signature match before invoking business logic. Preserve all
   raw covered-header instances until duplicate checks finish.

The freshness window is not a nonce/replay cache. A captured paired request can
still be fresh within that window; network isolation and secret custody remain
required. Business retries use the operation's own idempotency rules, including
the A2A `dispatch_id` and exact-body rule.

| Signed context header | Meaning after pairing verification |
|---|---|
| `X-AAC-Root-Token-Id` | Root identifier for correlation |
| `X-AAC-Presenter-Token-Id` | Current presented chain identifier |
| `X-AAC-Hop-Index` | Chain hop index |
| `X-AAC-Originator-Tenant-Id` | Root's originator tenant |
| `X-AAC-Presenter-Spiffe-Id` | Verified presenting workload |
| `X-AAC-Task-Ref` | Task restriction/correlation; preserve it in the supported response |
| `X-AAC-Envelope-Schema` | Required value `aac.a2a.egress.v1` for paired-agent A2A dispatch |

Before the signature check these are caller-controlled strings. Use the
documented body/envelope schema too; a valid HMAC alone does not grant broader
authority or make an arbitrary callback body valid.

### Pairing test vector

The deterministic values below are for interoperability tests only. Never use
this secret for a deployment. `canonical` contains literal LF characters after
JSON decoding; its last character is the final `o` in `task-demo`.

<!-- pairing-vector-example:start -->
```json
{
  "secret_ascii": "0123456789abcdef0123456789abcdef",
  "method": "POST",
  "path": "/invoke",
  "timestamp": 1700000000,
  "body_utf8": "{\"task\":\"demo\"}",
  "headers": {
    "X-AAC-Task-Ref": "task-demo",
    "X-AAC-Hop-Index": "2",
    "Content-Type": "application/json"
  },
  "canonical": "AAC1-HMAC-SHA256\nPOST\n/invoke\n1700000000\n74d517bf80045934cfecf491867e9b328c71686f935ca9c57e469ccc28868e3a\nx-aac-hop-index:2\nx-aac-task-ref:task-demo",
  "signature_header": "AAC1-HMAC-SHA256 a931b3d7e2cfc7625f6dc00a75721ff297a51df006926519f922ecef440c20c5"
}
```
<!-- pairing-vector-example:end -->

Python agents can use the published library's `sign_invoke_request` and
`verify_invoke_request` functions, as the runnable example does. Its pairing
errors are `MissingInvokeAuthHeader`, `MalformedInvokeAuthHeader`,
`InvokeTimestampOutsideWindow` and `InvokeSignatureMismatch`; the supplied
middleware rejects unauthenticated requests with HTTP 401 before business logic.
`WeakInvokeAuthSecret` prevents startup with fewer than 32 secret bytes.
These library error names are distinct from the sidecar's `ERR_*` envelope.
