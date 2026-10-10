Canonical: https://docs.cascadeauth.com/sidecar/operations/

Applies to: AAC Sidecar v0.5.2

Documentation revision: c98313cbcdbd77be7d2230873480ac48b7e8cf09

---

# Operate and troubleshoot the sidecar

[Start the AAC journey](https://docs.cascadeauth.com/get-started/) · [All references](https://docs.cascadeauth.com/sidecar/configuration/)

This reference is for a deployment or integration you have chosen to configure.
For the first authenticated reservation, use the packaged Compose journey above.

Use the actual paths printed by your setup and run. The executable offline
audit recipes below refer to the [optional protocol fixture](https://docs.cascadeauth.com/sidecar/integration/#optional-runnable-paired-agent-example)
and its `AAC_DEMO_DIR`; the reservation demo instead prints its retained agent
state paths and saved mint response. Do not guess a tenant's local file path.

## Diagnostics and support

Work in this order: exact installed version → configuration/file permissions →
`/healthz` and `/readyz` → trust publication and certificate validity → workload
projection → pairing → workflow outcome → local and central evidence. A 401
at an agent callback means pairing failed before business execution. A trust
or recipient rejection should leave the agent untouched. A healthy process
with missing trust can remain unable to accept an authenticated workflow.

Contact `support@cascadeauth.com` with the version, image/bundle digest,
platform, timestamp/time zone, request/root identifier if appropriate, stable
error code and sanitized reproduction. Beta support is best-effort without a
24/7 SLA. For a suspected compromise, stop affected admission, preserve local
evidence and contact the same support address; your operator owns credential
revocation and recovery. License questions go to `legal@cascadeauth.com`.
## Optional central trace forwarding

The sidecar always follows its configured local telemetry sink. To also send
eligible chain metadata to AAC, add this block using the supplied data-plane
URL and a private tenant API-key file:

```yaml
sidecar:
  telemetry:
    sink: "/var/lib/aac/telemetry.jsonl"
    central_forward:
      control_plane_url: "https://api.stage.cascadeauth.dev"
      api_key_file: "/etc/aac/keys/tenant-api-key"
```

The parent directory must exist. The sidecar exchanges that API key for a
short-lived `telemetry-ingest` session and sends only the allowed central
metadata. Business payloads, task references, human claims, raw AAC/DPoP
credentials and terminal attestations remain local. A2A protocol diagnostics
without chain identifiers also remain local. Local `sink: "none"` may be used
with central forwarding when local retention is intentionally disabled.

Forwarding uses a bounded background queue and never waits on the authorization
path. Outages, queue saturation or shutdown can lose central events; retain
local audit data according to your needs. Coarse local warnings identify
exchange/forward failures without printing credentials or response bodies. The
API-key file is reread on each token exchange, so an atomic replacement takes
effect without a restart; already-issued sessions retain their own expiry.

After a real workflow, use `aac chain --help` and the returned root token
identifier to inspect its central trace. Allow for asynchronous delivery;
successful local events alone do not prove central delivery.
## Audit your workflows

Configure a tenant-local JSONL sink and retain it alongside your application's
business audit. Each line is one JSON object; fields not applicable to an event
are omitted. Start with `root_token_id` from the client, then follow token IDs,
hop indices, workload identities, decisions and failures across your sidecars.
Wall-clock arrival order across hosts is not a causal guarantee.

| Event | Interpretation |
|---|---|
| `mint` | Root/initial authority creation or its failure |
| `receive` | Authority admission and local delivery, or a verification/callback failure |
| `dispatch` | Outbound delegation/result, including downstream failure |
| `respond` | Local terminal response; a successful settlement includes the compact JWS |
| `composite_mint` | A supported composite authority was created from multiple arrivals |
| `a2a_ingress` | Protocol/body/admission diagnostics for a unary A2A request |
| `a2a_egress` | Paired-agent A2A dispatch outcome and retained-state pressure |

Native events use `result: success` or `failure`; A2A diagnostics may use
`accepted`, `rejected` or `failed`. Event availability depends on how far the
request progressed. A request rejected before authority can be decoded may
have no root/token ID. A bad pairing signature at the application is an
application HTTP 401, not proof of a chain-verification event at the sidecar.

### Local event fields

| Fields | Meaning |
|---|---|
| `timestamp_unix_seconds`, `event_type`, `result` | Event time as Unix seconds (possibly fractional), category and outcome |
| `root_token_id`, `token_id`, `parent_token_id`, `hop_index` | Chain correlation and parent/hop relationships |
| `creator_svid_hash`, `audience_hash`, `caveat_audience` | Creator/audience binding and the readable audience where available |
| `tenant_id`, `actor_spiffe_id`, `presenter_spiffe_id` | Local tenant/actor and verified presenting workload |
| `caveat_predicates`, `destination`, `task_ref`, `originator_issuer` | Local restrictions, destination profile and task/originator context; may contain business-sensitive values |
| `parent_token_ids_list`, `parent_root_token_ids`, `parent_tenant_ids`, `inbound_token_id` | Multi-parent/composite and inbound correlation |
| `http_status`, `response_size_bytes`, `latency_ms` | Observed response and operation measurements when emitted |
| `terminal_attestation`, `terminal_attestation_verification` | Compact terminal JWS and the downstream verifier's recorded result, where available |
| `failure_code`, `failure_detail`, `agent_decision_action` | Stable failure category, diagnostic text (bounded), and agent decision |
| `agent_id`, `agent_descriptor_hash` | Optional agent/descriptor correlation |
| `method`, `protocol_version`, `result_kind`, `error_category` | Optional A2A protocol diagnostics |
| `request_body_bytes`, `configured_body_limit_bytes` | Request size and configured A2A body bound |
| `egress_entries`, `egress_reserved_cached_bytes`, `egress_cached_response_bytes` | Current local retained dispatch state and byte use |
| `egress_expired_reclaimed_total`, `egress_saturation_rejections_total`, `egress_oversize_rejections_total` | Cumulative reclamation/capacity/response-bound counters |
| `egress_conflicts_total`, `egress_in_progress_hits_total`, `egress_cached_hits_total` | Cumulative changed-body conflicts, in-progress hits and cached-result reuse |

Not every supported field is populated by every current path. Treat optional
absence as unknown, not a successful verification or a zero measurement.
Ordinary access/application logs are separate from this JSONL schema.

These abbreviated, synthetic examples show the shape, not complete captured
events. Ellipses indicate omitted values and must not be fed into a verifier:

```json
{"timestamp_unix_seconds":1700000000,"event_type":"mint","result":"success","root_token_id":"...","agent_decision_action":"forward"}
{"timestamp_unix_seconds":1700000001,"event_type":"receive","result":"failure","failure_code":"ERR_DPOP_REPLAY"}
{"timestamp_unix_seconds":1700000002,"event_type":"receive","result":"failure","failure_code":"ERR_RECIPIENT_NOT_AUTHORIZED"}
{"timestamp_unix_seconds":1700000003,"event_type":"respond","result":"success","root_token_id":"...","agent_decision_action":"settle","terminal_attestation":"..."}
```

### Investigate three common failures

| Symptom | What to inspect | Next step |
|---|---|---|
| Replayed proof | Receiver HTTP 403 with `ERR_DPOP_REPLAY`; local receive failure, possibly without a root ID | Do not resend a captured AAC/DPoP request. Use the originator/paired-agent API to produce a fresh proof; for a business retry preserve the original A2A dispatch ID and body. Never disable replay checks to retry. |
| Wrong recipient | Receiver `ERR_RECIPIENT_NOT_AUTHORIZED`; sender may record `ERR_DOWNSTREAM_REJECTED` | Compare `destinations.*.audience_pattern` to the receiver's exact `agent.spiffe_id`. A wildcard holder audience does not turn a different final recipient into the intended workload. |
| Bad pairing | Agent HTTP 401 before its business handler; library reports a missing/malformed header, timestamp skew or signature mismatch. Sidecar delivery can report `ERR_AGENT_REJECTED` | Compare the two secret files without printing them, check clocks, method/path, covered headers and exact body bytes. Sign once after serialization and transmit those bytes unchanged. |

Keep access logs or request correlation when a pre-verification failure has no
root ID. Do not invent a root association from unverified caller headers.
After a successful two-agent flow, correlate sender `dispatch` and receiver
`receive`/`respond`, then verify the terminal JWS below. An HTTP 200 alone is
insufficient evidence of the intended recipient or settlement.

### Retain and inspect safely

The sidecar writes file sinks with mode 0600 and fails startup for an unusable
path. Restrict access, encrypt backups, define a retention period, and forward
to an append-only/tamper-evident store if your audit requirements need it.
JSONL itself is not a signed or tamper-proof ledger. Preserve clock/source
metadata and test your collector's loss detection. For file rotation, coordinate
stop/reopen/restart; renaming an open file does not make the process reopen a
new path. Do not rely on log retention as a substitute for retained A2A state.

Central forwarding sends a smaller metadata envelope asynchronously. Payloads,
task references, human claims, raw authority/DPoP and terminal attestations stay
local. Central outages can lose events without stopping authorization. Use:

```bash
aac chain show --help
aac chain show --profile "$AAC_PROFILE" --token-id '<root_token_id>' --output json
```

Only participating tenants can inspect a trace. A missing central trace can
mean delayed/lost forwarding, an unknown ID, or no access; investigate local
evidence and coarse forwarding warnings before changing credentials.


### Verify terminal evidence offline

Save the local `terminal_attestation` string from a `respond` event into
`terminal.jws`. Verify it using your **already trusted CA certificates for that
workload's SPIFFE domain** and the expected tenant, workload, root and task
from your own registration/request records. Never derive those expectations or
trust anchors from the unverified JWS itself.

Install `python -m pip install --upgrade cryptography` in an isolated verifier
environment. Save the following as `verify_terminal.py`. It implements the
supported direct-CA, single-leaf Ed25519/P-256 profile, a 64-KiB input bound and a fixed 30-second
certificate clock tolerance. It checks the signature and identity/correlation
bindings; it does not reconstruct the entire AAC chain or prove the business
action happened. Pair it with the workflow and application audit records.

<!-- offline-attestation-example:start -->
```python
import argparse
import base64
import hashlib
import json
import re
import time
from pathlib import Path
from cryptography import x509
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec, ed25519
from cryptography.hazmat.primitives.asymmetric.utils import encode_dss_signature
from cryptography.x509.oid import SignatureAlgorithmOID

ORDER = int("FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551", 16)


def require(ok, message):
    if not ok:
        raise ValueError(message)


def unb64(value):
    require(bool(re.fullmatch(r"[A-Za-z0-9_-]+", value)), "Invalid base64url")
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def verify(compact, ca_pem, tenant, spiffe, root, task, at):
    require(len(compact) <= 65536, "Attestation too large")
    parts = compact.split(".")
    require(len(parts) == 3, "Expected compact JWS")
    header, claims = [json.loads(unb64(p)) for p in parts[:2]]
    require(isinstance(header, dict) and isinstance(claims, dict), "Expected JSON objects")
    require(
        header.get("typ") == "aac-terminal-attestation+jwt" and "crit" not in header,
        "Unsupported protected header",
    )
    require(header.get("alg") in ("EdDSA", "ES256"), "Unsupported algorithm")
    chain = header.get("x5c")
    require(isinstance(chain, list) and len(chain) == 1, "Expected one x5c leaf")
    leaf = x509.load_der_x509_certificate(base64.b64decode(chain[0], validate=True))
    public = leaf.public_key()
    spki = public.public_bytes(
        serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo
    )
    kid = base64.urlsafe_b64encode(hashlib.sha256(spki).digest()).rstrip(b"=").decode()
    require(header.get("kid") == kid, "Leaf-key fingerprint mismatch")
    uris = leaf.extensions.get_extension_for_class(
        x509.SubjectAlternativeName
    ).value.get_values_for_type(x509.UniformResourceIdentifier)
    require(
        [u for u in uris if u.startswith("spiffe://")] == [spiffe], "Unexpected workload identity"
    )

    def valid(cert):
        return (
            cert.not_valid_before_utc.timestamp() - 30
            <= at
            <= cert.not_valid_after_utc.timestamp() + 30
        )

    require(valid(leaf), "Leaf outside certificate validity")
    trusted = False
    for ca in x509.load_pem_x509_certificates(ca_pem):
        if not valid(ca):
            continue
        key = ca.public_key()
        try:
            if (
                isinstance(key, ed25519.Ed25519PublicKey)
                and leaf.signature_algorithm_oid == SignatureAlgorithmOID.ED25519
            ):
                key.verify(leaf.signature, leaf.tbs_certificate_bytes)
            elif (
                isinstance(key, ec.EllipticCurvePublicKey)
                and isinstance(key.curve, ec.SECP256R1)
                and leaf.signature_algorithm_oid == SignatureAlgorithmOID.ECDSA_WITH_SHA256
            ):
                key.verify(leaf.signature, leaf.tbs_certificate_bytes, ec.ECDSA(hashes.SHA256()))
            else:
                continue
            trusted = True
            break
        except Exception:
            continue
    require(trusted, "Leaf not signed by a currently valid trusted CA")
    signature = unb64(parts[2])
    data = ".".join(parts[:2]).encode("ascii")
    require(len(signature) == 64, "Expected 64-byte signature")
    if header["alg"] == "EdDSA":
        require(isinstance(public, ed25519.Ed25519PublicKey), "Algorithm/key mismatch")
        public.verify(signature, data)
    else:
        require(
            isinstance(public, ec.EllipticCurvePublicKey)
            and isinstance(public.curve, ec.SECP256R1),
            "Algorithm/key mismatch",
        )
        r, s = int.from_bytes(signature[:32], "big"), int.from_bytes(signature[32:], "big")
        require(0 < r < ORDER and 0 < s <= ORDER // 2, "Invalid or noncanonical ES256 signature")
        public.verify(encode_dss_signature(r, s), data, ec.ECDSA(hashes.SHA256()))
    expected = {
        "iss": tenant,
        "terminal_agent_svid": spiffe,
        "root_token_id": root,
        "task_ref": task,
    }
    require(isinstance(root, str) and bool(root), "Expected root must be nonempty")
    for name, value in expected.items():
        require(claims.get(name) == value, "Claim mismatch: " + name)
    require(
        bool(re.fullmatch(r"tnt-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}", tenant)),
        "Invalid expected tenant",
    )
    require(
        type(claims.get("iat")) is int and -(2**63) <= claims["iat"] < 2**63,
        "Invalid issued-at time",
    )
    require(
        isinstance(claims.get("settlement_id"), str) and bool(claims["settlement_id"]),
        "Missing settlement ID",
    )
    require(
        "action_summary" not in claims or isinstance(claims["action_summary"], str),
        "Invalid action summary",
    )
    return {"verified": True, **expected, "settlement_id": claims["settlement_id"]}


def read_compact(path):
    with Path(path).open("rb") as stream:
        raw = stream.read(65537)
    require(len(raw) <= 65536, "Attestation file exceeds 64 KiB")
    return raw.decode("ascii").strip()


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    for flag in ("jws", "ca", "tenant", "spiffe", "root", "task"):
        p.add_argument("--" + flag, required=True)
    p.add_argument("--at", type=int, default=None)
    a = p.parse_args()
    result = verify(
        read_compact(a.jws),
        Path(a.ca).read_bytes(),
        a.tenant,
        a.spiffe,
        a.root,
        a.task,
        int(time.time()) if a.at is None else a.at,
    )
    print(json.dumps(result))
```
<!-- offline-attestation-example:end -->

```bash
python verify_terminal.py --jws terminal.jws --ca "$AAC_DEMO_DIR/pki/dev-ca.crt" \
  --tenant "$AAC_TENANT_ID" --spiffe "spiffe://${AAC_TRUST_DOMAIN}/demo/agent" \
  --root '<root_token_id returned by your client>' --task '<task_ref from your request>'
```

For the normal current-time check, omit `--at`. For historical analysis, use an
independently trusted observation time and archived trusted CA material; never
use an unverified `iat` to choose the certificate time. Historical verification
does not establish that a key is trusted or a credential active now.
The attestation has no expiry claim; `iat` is signed metadata, not a replay
defense. Check it against your independently recorded workflow timeline.
For a result from the two-agent example's peer, use its registered
`spiffe://<trust-domain>/demo/peer` identity instead of `/demo/agent`.
## Sidecar error reference

Application errors use this envelope; `detail` may be null and diagnostic
wording may change. Use `code` for automation and `request_id` for support.
The HTTP status and `code` together identify the response; the same code can
appear at different operation boundaries.

```json
{"error":{"code":"ERR_RECIPIENT_NOT_AUTHORIZED","message":"Recipient verification failed","detail":null,"request_id":"req-aac-sdk-example"}}
```

| Code | Meaning and next action |
|---|---|
| `ERR_A2A_AUTHORITY_REGISTRATION_FAILED` | Verified inbound continuation could not be retained; retry only after the local authority/state problem is resolved. |
| `ERR_A2A_DISPATCH_FAILED` | Outbound A2A operation failed; inspect local logs and endpoint/TLS configuration before retrying. |
| `ERR_A2A_DISPATCH_TIMEOUT` | A2A operation exceeded its deadline; reconcile the outcome and preserve the dispatch ID/body. |
| `ERR_A2A_DISPATCH_UNCERTAIN` | Delivery outcome is unknown; do not create a new dispatch ID to repeat a possible business action. |
| `ERR_A2A_OVERLOADED` | A2A admission capacity is full; apply backoff and check configured concurrency/headroom. |
| `ERR_A2A_REMOTE_REJECTED` | The peer rejected A2A delivery; inspect its authorized error response and recipient/profile expectations. |
| `ERR_AGENT_REJECTED` | The local agent returned a rejecting HTTP response; check pairing first, then its application policy/logs. |
| `ERR_AGENT_TIMEOUT` | Local agent response exceeded its budget; inspect the handler and deadlines. |
| `ERR_AGENT_UNREACHABLE` | Local agent could not be reached; check process, loopback namespace, port and TLS settings. |
| `ERR_CHAIN_INVALID` | Chain structure or restrictions are invalid; inspect the submitted chain and attenuation rules. |
| `ERR_CLASS_OF_ACTION_NOT_FOUND` | Mint/originate named an unknown class; use a configured `classes_of_action` name. |
| `ERR_CONFIG_ERROR` | The requested operation lacks valid configuration; inspect signer/material/duration settings and startup logs. |
| `ERR_CONTINUATION_AUTHORITY_UNAVAILABLE` | Inbound authority is missing or expired for this pair/task/presenter; obtain a new authorized arrival rather than fabricating continuation. |
| `ERR_DESTINATION_NOT_FOUND` | A decision/envelope named no configured destination; correct its profile name. |
| `ERR_DOWNSTREAM_REJECTED` | Native downstream delivery was rejected; inspect the peer's response and expected identity/restrictions. |
| `ERR_DOWNSTREAM_TIMEOUT` | Downstream transport failed or timed out; check TLS, reachability and budgets, and reconcile before retrying business work. |
| `ERR_DPOP_ATH_MISMATCH` | Proof does not bind the submitted authority credential; transmit the matching chain and proof together. |
| `ERR_DPOP_CHAIN` | Proof certificate/trust validation failed; check CA publication, algorithms and certificate validity. |
| `ERR_DPOP_HTM` | Proof HTTP method differs from the request; sign for the actual method. |
| `ERR_DPOP_HTU` | Proof URL differs from the request; check final scheme/host/port/path and proxy routing. |
| `ERR_DPOP_REPLAY` | Proof has already been claimed; obtain fresh authorization/proof through supported APIs, preserving business idempotency. |
| `ERR_DPOP_SIG` | Proof signature or protected-header profile is invalid; check signer, algorithm and exact signed bytes. |
| `ERR_DPOP_TIME` | Proof time is outside the accepted window; synchronize clocks and generate a fresh proof. |
| `ERR_DPOP_TTL_TOO_LONG` | Proof lifetime exceeds the supported bound; use the sidecar's supported issuance path. |
| `ERR_DUPLICATE_CONVERGENCE` | The composite task is already converging; do not trigger a second concurrent convergence. |
| `ERR_EGRESS_DISPATCH_IN_PROGRESS` | The same A2A operation is still running; back off and retry the same ID/body. |
| `ERR_EGRESS_IDEMPOTENCY_CONFLICT` | An existing dispatch ID was reused with different authenticated bytes; preserve the original request or start a genuinely new operation. |
| `ERR_EGRESS_IDEMPOTENCY_SATURATED` | Retained dispatch capacity is exhausted; check retention and qualified entry/byte budgets. |
| `ERR_EGRESS_RESPONSE_TOO_LARGE` | Response exceeded the retained-result bound; reconcile the operation and review the configured response limit. |
| `ERR_HMAC_CHAIN_MISMATCH` | Chain authentication failed; reject the chain and check its serialized/delegated form. |
| `ERR_INTERNAL_ERROR` | An internal operation failed; retain the request ID and sanitized evidence for support. |
| `ERR_INTERNAL_VERIFIER_ERROR` | Verification failed internally; stop relying on that attempt and report the request ID. |
| `ERR_INVALID_AGENT_DECISION` | The agent returned an invalid/unsupported decision or used it at the wrong workflow stage; fix the handler response. |
| `ERR_INVALID_MINT_INPUT` | Native authority input is invalid or conflicts: check predicate names, canonical integers, byte limits and task_ref consistency; remove request valid_until and use class valid_for. |
| `ERR_PAIRING_AUTH_FAILED` | Native chain-start pairing failed (401): sign the exact POST alias/raw body with this pair's secret, use fresh canonical headers once each, and check clock skew. |
| `ERR_INVALID_AGENT_RESPONSE` | Agent/peer response does not match the supported response schema; validate the integration contract. |
| `ERR_INVALID_OIDC_ISSUER` | Originator issuer is invalid for this request; use the verified application's correct issuer. |
| `ERR_INVALID_REQUEST` | Request shape, headers, pairing or protocol metadata are invalid; inspect status/detail and the endpoint's request schema. |
| `ERR_INVALID_REQUEST_ENCODING` | Request text/encoding is invalid; send the supported UTF-8 representation. |
| `ERR_MISSING_AAC_MACAROON` | No required AAC authority credential was supplied; use the supported sending sidecar. |
| `ERR_MISSING_DPOP_PROOF` | No required presenting proof was supplied; use the supported sending sidecar. |
| `ERR_MISSING_REQUIRED_HEADER` | A required operation header is absent; supply the documented value. |
| `ERR_PRESENTER_NOT_PREVIOUS_HOLDER` | Presenting workload is not the previous authorized holder; correct the sender/chain binding. |
| `ERR_RECIPIENT_NOT_AUTHORIZED` | Receiving workload is not the exact final recipient; correct the destination audience. |
| `ERR_REPLAY_AUTHORITY_INCOMPATIBLE` | Replay service/profile is incompatible; restore the supported authenticated retained-write-safe configuration. |
| `ERR_REPLAY_AUTHORITY_QUARANTINED` | Replay authority is in its safety quarantine; keep admission closed until it is ready. |
| `ERR_REPLAY_AUTHORITY_SATURATED` | Replay storage has reached its safe bound; Basic admits new claims as old records expire. Size for all new replay claims, including requests rejected later. Never evict unexpired records to make room. |
| `ERR_REPLAY_AUTHORITY_TIMEOUT` | Replay decision timed out; check service health/latency rather than bypassing it. |
| `ERR_REPLAY_AUTHORITY_UNAVAILABLE` | Replay authority is unavailable; restore it before admitting requests. |
| `ERR_REQUEST_TOO_LARGE` | Body/header/operation limit was exceeded; reduce the request or qualify an appropriate configured limit. |
| `ERR_ROOT_SIGNATURE_INVALID` | Root signature is invalid; check root key ID, trust publication and signed content. |
| `ERR_ROUTE_NOT_FOUND` | Method/path is unsupported on that listener; check endpoint and port. |
| `ERR_STATE_STORE_UNAVAILABLE` | Local workflow arrival state is unavailable; repair the state service before retrying. |
| `ERR_T0_ON_WIRE` | A root-only token was sent where a delegated chain is required; use the sidecar's normal dispatch path. |
| `ERR_T1_ON_WIRE` | Initial holder authority was sent without a peer delegation; use the normal dispatch path. |
| `ERR_TOKEN_EXPIRED` | Authority has expired; obtain a new authorized task/chain. |
| `ERR_TOKEN_FORMAT` | Serialized authority cannot be decoded as the supported token format; do not alter or hand-construct it. |
| `ERR_TOKEN_NOT_FOUND` | Required buffered arrival/token is absent; check task/token correlation and lifecycle. |
| `ERR_UNKNOWN_PREDICATE` | A restriction name is unsupported; use the published predicate vocabulary. |
| `ERR_UNKNOWN_TENANT_KEY` | Referenced tenant/root key is not in the trusted set; check tenant ID, key ID, publication and revocation. |
| `ERR_UNSUPPORTED_MEDIA_TYPE` | Content type is unsupported; use the endpoint's documented JSON media type. |

Authenticated A2A protocol errors can instead use JSON-RPC errors under HTTP 200:
`-32700` parse error, `-32600` invalid request, `-32601` unknown method,
`-32602` invalid parameters, `-32004` unsupported operation and `-32009`
unsupported version. Inspect the JSON body even when HTTP transport succeeded.
Admission/authentication/body-size errors may use non-200 HTTP responses.

CLI/control-plane errors are a separate surface. For example,
`ERR_API_KEY_LAST_ACTIVE` belongs to API-key retirement, not sidecar receiving;
its documented recovery is to issue/migrate a second active key first.
## Upgrade, rollback, and uninstall

- Verify a new immutable version before placing it in a new version directory.
- Stop admission, point the service symlink at the new version, restart, and
  require health/readiness before restoring traffic.
- Roll back by restoring the previous verified symlink; never replace an
  existing version directory in place.
- Preserve bbolt, Shared durable replay, trust, and configuration state across
  binary/image replacement according to the tenant retention policy. Basic
  replay history is lost on every restart; choose Shared durable if that is
  unacceptable.
- Remove the image or versioned binary only after stopping the service and
  completing the chosen credential-retention or retirement plan below. Public artifacts already downloaded by others
  cannot be recalled.

Developer-binary uninstall:

```bash
rm "${HOME}/.local/bin/aac-sidecar"
rm -rf "${HOME}/.local/lib/aac-sidecar/releases/v0.5.2"
```

Do not use those commands for an operator-owned production directory or state
volume. Follow the tenant's change, retention, and secure-deletion procedures.

### Rotate or revoke credentials deliberately

A binary upgrade does not rotate tenant credentials. Before revocation, identify
all clients of the exact key and distinguish planned rotation from compromise:

```bash
aac tenant api-key list --profile "$AAC_PROFILE" --output table
aac tenant api-key issue --help
aac tenant api-key retire --help
aac tenant reissue-api-key --help
aac trust-anchor list --profile "$AAC_PROFILE" --output table
aac trust-anchor revoke --help
```

For planned API-key rotation, issue the second active key, migrate all clients,
verify them, then retire the exact old key. The control plane refuses to retire
the last ACTIVE API key (`ERR_API_KEY_LAST_ACTIVE`); issue and migrate a second
key first. For a lost/compromised key, follow
the recovery command's separate semantics. The telemetry API-key file is
reread on token exchange; existing sessions keep their own expiry.

Root-key rotation uses a new key ID, publishes its public key, waits for trust
visibility, moves the workload to it, verifies a real workflow, then revokes
the old key. **Revoking the last root-signing key is permitted** for compromise
or teardown; the API-key last-ACTIVE protection does not apply to root keys.
Revoked roots leave the public trust set, so verifiers lose trust in chains
rooted at that key when their trust view refreshes. Healthy control-plane-backed
caches poll every five minutes by default; outage stale-serve behavior remains,
and there is no instantaneous global revocation guarantee. Stop affected
workflows and coordinate trust refresh/replacement with peers. Do not assume
removing a public root erases a workload's locally held signing key.

Replace workload/terminal keys with matching valid certificates and update trust as required. Replace a
compromised pairing secret in both paired processes and restart them together.
For remote signers, disable/revoke the exact key version and verify failure
without provider/file fallback.

An unsafe beta is removed from recommendations and replaced by a newly
reviewed immutable version; its old digest is never overwritten. Pause affected
traffic and preserve evidence while deciding whether rollback is safe.

Local uninstall removes software, not a tenant account. For reusable testing,
stop the processes and retain tenant registration, credentials in your secret
manager, and necessary private state. Remove local credential copies only after
verifying custody. Permanent workload/credential retirement is a separate
operator action; this guide does not promise a tenant-account deletion API or
a complete tenant-offboarding procedure.
