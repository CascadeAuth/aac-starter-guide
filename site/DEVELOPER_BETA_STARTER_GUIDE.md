# AAC Sidecar public developer-beta starter guide

AAC Sidecar runs beside your agent to verify and carry delegated authority
between workloads. It checks signed AAC chains, workload identity and replay
protection, then delivers authenticated requests to your agent. Your agent
keeps its business policy and returns a supported decision.

Choose a container image for
Docker/Kubernetes or a standalone binary for a VM or macOS.
[Download the configuration template](https://cascadeauth.github.io/aac-starter-guide/sidecar-config.template.yaml)
and fill it with your tenant's provisioned identities, credentials and endpoints.

For a complete native AAC business example, run the public
[AAC: two tenants, one reservation made](https://github.com/CascadeAuth/aac-compose-demo).
It uses the general [`aac-cli`](https://pypi.org/project/aac-cli/) configuration workflow:
Vantis Equity delegates $8,000 of a simulated $10,000 travel approval to
Tourfedia, which returns a signed receipt for a reservation.
The example application creates a reservation result; supplier integration and
payment are omitted for clarity. The 30-minute limit bounds authority, not a
price hold. The demo checks asynchronous completion, the expected receipt signer
and chain root, local/receiver refusals, and certificate refresh/renewal.

## What AAC is for

AAC lets a network of AI agents — tens, hundreds or thousands of them, inside one
organisation and across organisations — carry **delegated authority** from agent
to agent, with provable identity, local verification and auditable receipts.

Authority starts with a decision your own application makes. Your application
authenticates the person, or obtains the approved service identity, and decides
what work it may authorize under your policy. AAC binds that decision into a
signed chain every later agent can check. In one chain:

1. **A person authorizes work.** The originating agent's sidecar **mints the root
   token**: a root block carrying your tenant id, a hash of the identity your
   application supplied, a hash of the originating workload's identity, the root
   key id, the signature algorithm and the issue time — signed with your tenant's
   **root signing key**. The sidecar then appends the first caveat, the class of
   action.
2. **Each agent that passes the work on attenuates the token.** It appends a
   caveat that cannot widen what may be done, can only shorten the expiry, and
   names the holder allowed to act next. Its sidecar signs a **proof of
   possession** with its identity key, showing that the workload presenting the
   certificate really holds the private key behind it.
3. **The receiving sidecar verifies locally**: the root signature against the
   originating tenant's published root public key, then the caveat chain and its
   conditions, then the presenter's proof of possession, its identity against the
   caveat that named it, and the replay check.
4. **The last agent** — the one with nobody left to call — finishes the work and
   signs a **receipt** that can be checked afterwards.

Two properties follow.

**Authority never widens as it travels.** A later hop's limits may stay the same
or become tighter; no operation produces a child token permitting more than its
parent. Holder binding is a separate control: each hop also names who may act
next, so the same chain does not become usable by a different agent.

**Every chain expires.** No chain outlives 24 hours from the moment its root was
signed. Work that runs longer takes a fresh authorization at a business
checkpoint rather than a longer chain.

### What local verification buys, and what it does not

Each hop is checked with local computation against trust material the sidecar
already holds: the root signature, the certificate chain, the proof of possession
and the chain's own conditions. Nothing on the request path asks the earlier
agents, or their identity providers, to re-authorize the hop — the person signs in
once, at the start, and the chain carries that decision onward. That is what keeps
authority affordable as a network grows: a chain crossing ten organisations makes
no fan-out of token-introspection calls to ten identity providers.

Three limits are worth knowing before you design around it:

* **Trust material is cached, and a cache can miss.** Sidecars refresh published
  root keys and CA certificates in the background, but a missing entry or a
  freshness deadline can make that refresh happen while a request is being
  verified — and verification **fails closed** when required trust material is
  unavailable or too stale.
* **A copied chain is not usable on its own, but a compromised agent is a
  different matter.** Whoever copies a chain still has to present a valid proof of
  possession as the holder the chain names, and still meets the replay checks. An
  attacker who has compromised an authorized agent is already inside those
  controls — which is why the business limits you put in caveats, not identity
  alone, are worth setting.
* **The shared durable replay profile adds a dependency** — a store your tenant
  operates — on the path of every received request. The Basic profile keeps replay
  state in the sidecar's own memory instead; see
  [replay protection profiles](#replay-protection-profiles).

### What a receipt proves

A receipt is your tenant's signed statement that an agent reported a particular
outcome. It is not by itself proof that the real-world action happened, and
checking one months later is not automatic: it needs the trust material published
at the time, an observation time you trust independently, and your own workflow
records. [Keys and certificates](https://cascadeauth.github.io/aac-starter-guide/keys-and-certificates.html) says what to keep;
[Verify terminal evidence offline](#verify-terminal-evidence-offline) has the
procedure.

## Before you start

For your first setup, budget about an hour of hands-on work; AAC assigns your
trust domain, so there is no DNS propagation wait unless you choose to bring a
domain of your own. The 5–10 minute Quick path applies once your tenant
configuration, credentials and agent are ready. Start with the path you need:

The commands use a Bash-compatible shell. The AAC Python packages require
Python 3.10 or later; `python3` below must refer to a supported interpreter.
New to AAC terminology? Start with
the [workflow overview and glossary](#how-a-delegated-workflow-works).

| Path | Have these ready |
|---|---|
| Register a developer tenant | A GitHub or Google account; Python 3.10+ with `venv`; a protected directory or secret manager for credentials. AAC assigns your trust domain, so no DNS record is required |
| Run the local Python example | The registered tenant and trust domain; Python environment with the companion libraries; OpenSSL 3.x; an installed sidecar; free local ports 8000, 8080 and 9443. The development PKI recipe below supplies the certificates. |
| Run the container | Docker and your running agent container, plus prepared configuration/key and writable state directories |
| Install a standalone binary | ORAS and Cosign for the signed bundle; choose the archive matching Linux/macOS and AMD64/ARM64 |
| Verify a container or audit artifacts — optional | Cosign and Docker Buildx for image verification; ORAS for the optional bundle; Python and Go for the optional deep audit |
| Deploy beyond the local example | Your managed PKI, chosen replay profile, qualified retained A2A storage, and restricted HTTPS ingress; size and test these for your environment |

Artifact verification and deep audit are optional user paths, not prerequisites
to use AAC. The standalone-bundle path still needs its listed download tools.
No Docker Hub account is needed for public pulls. Keep your machine's clock
synchronized and its public CA certificates installed. You do not need an
existing corporate PKI for the development example. Its short-lived test CA
must stay separate from production identities and trust stores.

New tenant: [register](#register-your-developer-tenant), [create development PKI](#generate-development-pki),
[publish public trust](#publish-public-trust-material), then [run the local example](#optional-runnable-paired-agent-example).
Existing tenant: use the Quick guide below, or go directly to
[audit and diagnostics](#audit-your-workflows). Non-Python agent authors can
start with the [pairing protocol](#pairing-authentication-for-any-language).

## Quick installation and run guide

For a 5–10 minute Docker install with your tenant configuration and paired
agent ready, follow the [public quick installation and run guide](https://hub.docker.com/r/cascadeauth/aac-sidecar/).
It starts with `docker pull cascadeauth/aac-sidecar:v0.4.4`, identifies
the required configuration and starts the container using the version tag.
The detailed verification and deployment instructions below are the advanced
path. Tenant onboarding and credential provisioning come before either path.

The full path is: [onboard and publish trust](#register-your-developer-tenant),
[configure/install](#advanced-installation-guide--container),
[run the optional example](#optional-runnable-paired-agent-example), then
[verify artifacts deeply if needed](#optional-deep-artifact-audit).
The tables below are reference material; use the Quick guide above when your
tenant configuration and agent are already ready.

## Installation artifacts inventory

Choose **one sidecar installation format**: the container for Docker/Kubernetes,
or a standalone binary for a VM, systemd host or macOS. The remaining artifacts
serve tenant administration, public-trust publication and workload integration.
They do not all need to be installed on every workload host. For the
trust-anchor publisher, choose **one deployment option** as well: its Docker
container or Python package. Both run the same daemon. Run one writer for
your tenant's root keys and one for each active domain binding, reusing an
existing publisher where available: a tenant with a single trust domain needs
one process, and a tenant that keeps its assigned domain and adds its own runs
two, with root-key publishing enabled in exactly one of them.

The package pages and downloads below are public. Installing these artifacts
does not require a GitHub, Docker Hub or PyPI account. Registering and managing
your AAC tenant does require the sign-in described later in this guide.

| Artifact | Package or registry location | Type | When to install |
|---|---|---|---|
| AAC CLI | [aac-cli](https://pypi.org/project/aac-cli/) on PyPI | Command-line administration tool | Used by the tenant operator for this guide's onboarding, credentials, public trust and trace commands. The running sidecar does not depend on the CLI. |
| AAC Sidecar container (default) | [docker.io/cascadeauth/aac-sidecar](https://hub.docker.com/r/cascadeauth/aac-sidecar) | Ready-made Linux container image | Choose this for Docker/Kubernetes. This and the standalone binary below are alternative installations of the same sidecar. |
| Trust-anchor publisher Docker container | [ghcr.io/cascadeauth/aac-trust-anchor-publisher](https://github.com/orgs/CascadeAuth/packages/container/package/aac-trust-anchor-publisher) | Containerized public-trust publisher | Choose this for a container host or orchestrator to publish/manage the tenant's public root keys and SPIFFE CA bundle. Docker or the orchestrator manages its lifecycle. |
| Trust-anchor publisher Python package (alternative) | [aac-trust-anchor-publisher](https://pypi.org/project/aac-trust-anchor-publisher/) on PyPI | Python wheel that installs the publisher daemon command | Choose this for installation in a host/VM's Python virtual environment; use systemd on a managed Linux host where applicable. It requires Python, unlike the sidecar's compiled standalone binary. |
| AAC Sidecar standalone bundle (alternative) | `oras pull --output ./aac-sidecar-bundle docker.io/cascadeauth/aac-sidecar:v0.4.4-bundle` | Download containing standalone binaries, guide/template and audit evidence | Choose this if you are not using the container. [Install ORAS](https://oras.land/docs/installation/), then follow the [standalone installation steps](#alternative-standalone-binary-installation-with-oras). Container users can download the template directly from this site. |
| Invoke authentication | [aac-invoke-auth](https://pypi.org/project/aac-invoke-auth/) on PyPI; optional `[fastapi]` extra | Framework-independent Python signing/verification library, with an optional FastAPI/Starlette adapter | Install it in a Python workload that uses these helpers. Use `[fastapi]` for the supplied middleware/dependency integration or this guide's Python example. Other stacks need compatible pairing authentication; they do not need to install this Python package. |

**Image verification does not require the standalone bundle.** The container
signature is attached to its registry image and can be checked directly with
Cosign, followed by a pull of the verified digest. The bundle adds standalone
binaries and the SPDX/provenance/OCI files used by the optional deep audit.
ORAS is a command-line tool for downloading files stored in a container
registry. The command above saves the bundle's files in `./aac-sidecar-bundle`;
use a new, empty directory. Use `oras pull` for these files and `docker pull`
for the runnable sidecar image. ORAS is not needed to run the sidecar.

### Installing current releases

Use the current release of each AAC artifact. The sidecar installation commands
below use the current published version. The image and standalone bundle use
the same version. Exact versions
and digests are available in the [release record](https://cascadeauth.github.io/aac-starter-guide/released-components.json).

The sidecar has no `latest` tag, so an untagged pull will fail and every sidecar
command here names the version. Its companion packages are different: install
the current release of each from PyPI without a version pin, and let pip resolve
it —

- [`aac-cli`](https://pypi.org/project/aac-cli/) — the operator's command line
- [`aac-trust-anchor-publisher`](https://pypi.org/project/aac-trust-anchor-publisher/) — publishes the tenant's public trust material
- [`aac-invoke-auth`](https://pypi.org/project/aac-invoke-auth/) — verifies sidecar pairing signatures in a Python application

Upgrade an existing companion installation before following this guide. Pin a
version only when your own deployment needs a fixed one.

For the advanced verification path, reject a tag that does not resolve to a
SHA-256 digest or an artifact whose signature or digest fails.

Downloading, copying, installing, or using the sidecar accepts the included
`AAC Sidecar Developer Beta Binary License 1.0`. The three Python companion
artifacts remain independently licensed under Apache-2.0. The bundle and image
also carry `THIRD_PARTY_NOTICES.md` for modules linked into the compiled binary.

## How a delegated workflow works

```text
Originator application
  |  mint-root: choose authority and submit a task
  v
Sidecar A --authenticated /invoke--> Agent A
  |  Agent A returns forward(destination, narrower predicates)
  |  signed chain + proof of the presenting workload
  v
Sidecar B --authenticated /invoke--> Agent B
  |  Agent B returns settle or refuse
  v
settle -> signed settlement evidence
refuse -> refusal result (no terminal attestation)
```

Sidecar B checks authority, identity, recipient and replay protection before
calling Agent B. Each agent still decides whether the requested business action
is appropriate. A `forward` decision can narrow authority, never broaden it.
The local example uses one sidecar twice; the two-agent example shows the same
flow with separate processes. Optional central telemetry correlates selected
metadata; full local evidence stays with the tenant.

| Term | Meaning and configuration |
|---|---|
| Tenant | The organization/project boundary assigned a `tnt-<uuid>` ID; `tenant.id` |
| Workload / agent | Your running application, identified by one concrete SPIFFE ID; `agent.spiffe_id` |
| Sidecar | The process beside a workload that verifies and carries authority |
| Root-signing key | Starts an authority chain; `tenant.signing_key_file` or a configured remote signer |
| SVID | An X.509 certificate binding a workload SPIFFE identity to its public key; `agent.svid_cert_file` |
| DPoP | Proof signed by the presenting workload, binding authority to the exact HTTP request; uses the local SVID key |
| Class of action | A named initial authority profile selected at mint time; `classes_of_action` |
| Predicate | A restriction such as `action`, `amount_max`, `task_ref` or expiry |
| Holder audience | The workload identity permitted to hold a chain step; class and attenuation audience constraints |
| Destination | A named peer URL, exact recipient identity and limits; `destinations` |
| Attenuation | Creating a child authority step with equal or narrower permissions |
| Continuation authority | A short-lived right to continue a verified inbound task for the same pair/task/presenter |
| Settle / terminal attestation | An agent finishes a task and its sidecar signs the terminal evidence using a distinct key |
| Pairing secret | Authenticates calls between one sidecar and its paired agent; `sidecar.agent_invoke_auth.secret_file` |
| Replay protection | Rejects repeated presenting proofs; `replay_protection` |
| A2A retry state | Retains dispatch outcomes so the same dispatch ID/body can be retried without executing twice; `a2a.egress_idempotency` |

## AAC stage endpoints

Use `https://api.stage.cascadeauth.dev` for both CLI admin and data-plane
requests. Public trust documents are served from
`https://trust.stage.cascadeauth.dev`. These are AAC stage endpoints, not a
production service or an instruction to expose your sidecar's loopback port.

Check HTTPS reachability without credentials or tenant creation:

```bash
curl --fail --silent --show-error https://api.stage.cascadeauth.dev/healthz
```

The response includes `status: ok` and `control_plane_version`. This is a
liveness check, not proof that your tenant, trust material, or sidecar is ready.

## Supported deployments and endpoint allowlist

| Surface | Supported beta profile |
|---|---|
| Container | Linux amd64/arm64; ready-made distroless image; UID/GID 65532 |
| Standalone | Linux amd64/arm64 and macOS amd64/arm64; non-root process |
| Agent pairing | Same network namespace; local `/invoke` and `/a2a/v1` authenticated with the per-pair secret |
| Native A2A | A2A 1.0 unary `SendMessage`; JSON-RPC 2.0; no streaming or general-purpose A2A method support |
| Root and terminal signing | File-backed Ed25519/P-256, or explicit Azure Key Vault Standard software-protected non-exportable P-256 keys |
| Workload DPoP | Local file-backed key matching the SVID; remote DPoP is unsupported |
| Replay | Basic: explicit memory/`basic`, process-local and lost on restart. Shared durable: qualified authenticated-TLS Valkey `ha-retained-write-safe`; no fallback |
| A2A retry state | Retained private bbolt file, one process owner; storage must be qualified for your deployment |
| Service level | Developer evaluation/integration beta; no production SLA or production-rate claim |

The sidecar is provider-neutral. AWS/GCP/HSM/PKCS#11 signer adapters, general
plugin loading, and tenant-built sidecar images are outside this beta profile.
Azure hosting is optional; use the qualification worksheet below if relevant.

Allow only the endpoints your selected installation actually needs:

| Caller | Destination | Purpose and boundary |
|---|---|---|
| Installer | Docker Hub registry/auth/content endpoints for `docker.io/cascadeauth/aac-sidecar` | Public image and bundle download; no AAC artifact credential |
| Installer | `pypi.org`, `files.pythonhosted.org` | Public Python companion/sample dependencies |
| Publisher container installer | `ghcr.io/cascadeauth/aac-trust-anchor-publisher` and GHCR's content endpoints | Optional public publisher image |
| Advanced verifier | Sigstore's public verification/transparency services as required by Cosign | Validate release identity and transparency evidence |
| CLI, sidecar projection/telemetry, publisher | `https://api.stage.cascadeauth.dev:443` | Admin/data APIs, STS, signed trust ingest; use the appropriate credential role |
| Sidecar, publisher public reads | `https://trust.stage.cascadeauth.dev:443` | Public root-key and SPIFFE-bundle polling |
| CLI/browser | Selected GitHub/Google sign-in endpoints and CLI's temporary local callback | Interactive identity-provider sign-in; no blanket IdP access needed by the sidecar |
| Paired agent/client | `127.0.0.1:8080`; sidecar to `127.0.0.1:8000` | Trusted local APIs/callbacks; do not expose outside the shared namespace |
| Peer sidecars | Explicit configured peer HTTPS endpoints, normally port 9443 | TLS, AAC chain, DPoP and recipient verification; URLs must be final, without redirects |
| Sidecar, if Shared durable selected | Tenant-local authenticated-TLS Valkey endpoint | Shared retained replay claims; no fallback to Basic or central service |
| Optional Azure signer | Exact tenant vault HTTPS hostname and platform managed-identity endpoint | Managed identity plus pinned key-version `get`/`sign`; no client secret or file fallback |

Registry/CDN and identity-provider redirects are operated by those providers;
apply their current endpoint policy to installer/browser hosts. They are not
a reason to allow general internet egress from the running sidecar. Your DNS,
time synchronization and PKI distribution must also work. The local sample
uses only loopback peer endpoints and the explicit stage trust/data hosts.

## Configuration and workflow state

Keep business progress and reports in your application's storage. Messages
waiting for other branches of a workflow are buffered temporarily and can be
lost when the sidecar restarts. Replay protection and retry-result storage do
not replace an application database.

For work spanning days or weeks, the tenant application must retain its own
business evidence and progress, then obtain independently authorized fresh
chains at checkpoints. It may explicitly reuse a `task_ref` for correlation.
Stored evidence does not renew expired authority; AAC does not supply a workflow
database or automatic long-running orchestration.

You can configure request timeouts in your sidecar YAML when an agent or peer
needs more or less time to respond:

| Tenant setting | Use it to |
|---|---|
| `timeouts.agent_invoke_timeout_seconds` | Limit how long the sidecar waits for your local agent |
| `timeouts.cross_org_dispatch_timeout_seconds` | Set the default timeout for a request to another sidecar |
| `destinations.<name>.timeout_ms` | Override that default for one destination, in milliseconds |

Use positive, unquoted numbers. A destination override takes precedence over
the dispatch default. For A2A, keep it within the configured overall operation
deadline. Leave these settings at their defaults unless your application needs
an adjustment.

Set authority duration with `valid_for` on the class or destination. Business
dates in the payload do not extend that authority or the request timeout.

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

## Optional Azure qualification worksheet

Complete this before relying on the Azure adapter or a particular storage
class. The local example does not supply these results. Keep identifiers and
sanitized receipts in your own tenant record; never send keys to AAC.

| Check | Record and pass condition |
|---|---|
| Exact package | Image/bundle digest, version, signature identity and guide checksum |
| Root/terminal keys | Separate, exact versioned HTTPS key URIs; Standard software-protected P-256; public keys match configured identity/certificates |
| Managed identity | Selected system/user-assigned identity and least-privilege key `get`/`sign`; local workload DPoP stays local |
| Failures | Disabled key, removed grant, auth failure, throttling, timeout, malformed/wrong-key response: no minted artifact and no fallback |
| Persistent storage | Provider/SKU/class/mount options; private ownership; remount and replacement retain bbolt; missing/corrupt/insecure/locked files fail closed |
| Capacity | Allocate storage for your expected traffic and retention period, including saved responses. Confirm records survive replacement and that capacity limits produce a clear, recoverable failure. |
| A2A requests | Check that your normal request sizes and response times fit your configured limits. Confirm retries do not repeat a completed business action. |
| Connectivity | Public trust polling, exact workload projection, central metadata delivery and local terminal evidence |
| Lifecycle | Credential rotation/revocation, upgrade, rollback, rejected-beta handling, local cleanup and retained-state custody |
| Cost/support | Your expected cloud costs, responsible operator and escalation contact |

When using `signers`, configure each purpose with `provider: azure-key-vault`
and an exact versioned `key_uri`; omit that purpose's file-backed private-key
setting. Keep the terminal certificate and workload SVID/key. Set
`AZURE_CLIENT_ID` only when selecting a user-assigned managed identity.
Unsupported providers or conflicting file/provider settings fail startup.

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

## Advanced installation guide — container

### 1. Verify and pull the image

Install Docker and Cosign. Verify the
published digest against CascadeAuth's GitHub Actions keyless identity:

```bash
set -euo pipefail
export AAC_SIDECAR_VERSION=v0.4.4
export AAC_SIDECAR_IMAGE=docker.io/cascadeauth/aac-sidecar
export AAC_SIDECAR_DIGEST="$(
  docker buildx imagetools inspect "${AAC_SIDECAR_IMAGE}:${AAC_SIDECAR_VERSION}" |
    awk '$1 == "Digest:" { print $2; exit }'
)"
[[ "${AAC_SIDECAR_DIGEST}" =~ ^sha256:[0-9a-f]{64}$ ]]

cosign verify \
  --certificate-identity 'https://github.com/CascadeAuth/aac-sidecar-go/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  "${AAC_SIDECAR_IMAGE}@${AAC_SIDECAR_DIGEST}"

docker pull "${AAC_SIDECAR_IMAGE}@${AAC_SIDECAR_DIGEST}"
docker image inspect "${AAC_SIDECAR_IMAGE}@${AAC_SIDECAR_DIGEST}" \
  --format '{{index .Config.Labels "org.opencontainers.image.version"}} {{index .Config.Labels "org.opencontainers.image.licenses"}}'
```

The final line must print:

```text
v0.4.4 LicenseRef-AAC-Sidecar-Developer-Beta-1.0
```

### 2. Place the sidecar beside the workload

The image already contains the compiled `/aac-sidecar` entrypoint and runs as
non-root `65532:65532`. Do not copy the binary into a tenant-built image.

The production security boundary expects the sidecar and its paired agent to
share one network namespace. In Kubernetes, put both containers in the same
Pod. The agent listens on `127.0.0.1:8000`; the sidecar keeps
`sidecar.agent_invoke_url: http://127.0.0.1:8000/invoke` and its loopback API on
`127.0.0.1:8080`. Expose only the sidecar external port `9443` through the
tenant's approved Service/ingress path.

Mount rather than bake:

- `/etc/aac/sidecar-config.yaml` — reviewed configuration, mode `0600`;
- TLS certificate/key and outbound CA material;
- the per-pair invoke-auth secret, read-only in both containers;
- tenant trust and SPIFFE material;
- any file-backed root/terminal signing material; and
- `/var/lib/aac` on operator-qualified persistent storage for bbolt state.

The starter selects Basic replay protection. Choose Shared durable when replay
history must survive restart or coordinate replicas; provision the qualified
Valkey service and workload credentials first. Both profiles require the normal
identity, trust, TLS and pairing setup. See [replay profiles](#replay-protection-profiles).

A minimal Pod fragment is:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: paired-agent
spec:
  securityContext:
    runAsNonRoot: true
    fsGroup: 65532
  containers:
    - name: agent
      image: <tenant-agent-image-by-digest>
      env:
        - name: AAC_INVOKE_AUTH_SECRET_FILE
          value: /etc/aac/invoke-auth/invoke-auth.secret
      volumeMounts:
        - name: invoke-auth
          mountPath: /etc/aac/invoke-auth
          readOnly: true
    - name: aac-sidecar
      # Paste the verified AAC_SIDECAR_DIGEST from step 1 after `@`.
      image: docker.io/cascadeauth/aac-sidecar@sha256:REPLACE_WITH_VERIFIED_DIGEST
      args: ["-config", "/etc/aac/sidecar-config.yaml"]
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      ports:
        - name: aac-external
          containerPort: 9443
      volumeMounts:
        - name: sidecar-config
          mountPath: /etc/aac
          readOnly: true
        - name: invoke-auth
          mountPath: /etc/aac/invoke-auth
          readOnly: true
        - name: aac-state
          mountPath: /var/lib/aac
  volumes:
    - name: sidecar-config
      secret:
        secretName: aac-sidecar-config
        defaultMode: 0400
    - name: invoke-auth
      secret:
        secretName: aac-invoke-auth
        defaultMode: 0400
    - name: aac-state
      persistentVolumeClaim:
        claimName: aac-sidecar-state
```

Set your tenant's TLS, trust, replay, signer, resource and ingress settings
before deploying. Download
[sidecar-config.template.yaml](https://cascadeauth.github.io/aac-starter-guide/sidecar-config.template.yaml),
fill every required path and identifier, and
verify replay, trust and an authenticated workflow before admitting traffic.

Plain Docker may use `--network=container:<agent-container>` to share the
agent's loopback namespace. Ordinary Docker Compose containers have separate
loopback interfaces; widening the sidecar loopback bind is a development-only
posture and requires `dev_mode: true`, so it is not the production recipe.

### 3. Verify process identity and readiness

```bash
docker exec aac-sidecar /aac-sidecar -version
curl --fail --silent http://127.0.0.1:8080/healthz
curl --fail --silent http://127.0.0.1:8080/readyz
```

Run the two HTTP checks from the shared Pod/network namespace. Do not expose
the loopback port. Liveness is not readiness: keep admission closed unless
`/readyz` confirms replay-authority readiness, then independently verify trust
material and an authenticated workflow.

## Companion developer tools

Install the AAC CLI on the operator's machine in a dedicated virtual
environment:

```bash
python3 -m venv .aac-tools
. .aac-tools/bin/activate
python -m pip install --upgrade aac-cli

aac --version
aac profile --help
aac tenant register --help
aac tenant api-key --help
aac trust-anchor --help
```

If this host will operate the tenant's publisher using Python, install it here.
Skip this wheel install if you use its container deployment or an existing
tenant-operated publisher:

```bash
python -m pip install --upgrade aac-trust-anchor-publisher
aac-trust-anchor-publisher --help
```

Install the following in the Python agent's environment for this guide's
optional FastAPI example or your own FastAPI/Starlette integration. It can use
the same environment for the local example:

```bash
python -m pip install --upgrade 'aac-invoke-auth[fastapi]'
python -c 'import aac_invoke_auth; print(aac_invoke_auth.__file__)'
```

`aac-invoke-auth` is a library, not a separate daemon. Its base package supplies
framework-independent Python helpers; another Python framework can use those
without the `[fastapi]` extra. Other workload stacks must provide equivalent
pairing authentication before trusting sidecar requests. Installing this Python
package is conditional; authenticating the paired calls is not.

For deployments with separate ingest and public trust hosts, set
`AAC_TAP_SPIFFE_BUNDLE_READ_URL` to the full public SPIFFE bundle URL supplied
for the trust domain. For stage that is
`https://trust.stage.cascadeauth.dev/.well-known/spiffe-bundle/<trust-domain>`.
Signed uploads continue to use the supplied API-host ingest URL.

Create a local stage profile after installing the CLI:

```bash
aac profile create stage \
  --admin-url https://api.stage.cascadeauth.dev \
  --data-plane-url https://api.stage.cascadeauth.dev
```

This writes local profile settings only; it does not register a tenant. If a
profile named `stage` already exists, inspect it before changing it. Continue with developer self-service below, or use your existing
enterprise tenant and approved credential process.
Never paste API keys, recovery keys, signing
keys, pairing secrets, private payloads, or complete configuration into support
messages.

### Register your developer tenant

Choose a new, unbound profile for each tenant. The following example uses the
`stage` profile created above and GitHub sign-in; use `--idp google` for Google.
Your verified identity becomes the first tenant administrator.

Generate a tenant-admin key in a new private directory. The publisher needs
this key to sign ingest requests; it is distinct from the workload's root key.
Do not rerun key generation over an existing key.

```bash
set -euo pipefail
export AAC_PROFILE=stage
export AAC_ONBOARDING_DIR="$HOME/aac-onboarding/$AAC_PROFILE"
umask 077
mkdir -p "$AAC_ONBOARDING_DIR"
test ! -e "$AAC_ONBOARDING_DIR/tenant-admin.pem"
openssl genpkey -algorithm ed25519 -out "$AAC_ONBOARDING_DIR/tenant-admin.pem"
openssl pkey -in "$AAC_ONBOARDING_DIR/tenant-admin.pem" \
  -pubout -out "$AAC_ONBOARDING_DIR/tenant-admin.pub.pem"

aac tenant register --profile "$AAC_PROFILE" \
  --display-name 'YOUR TEAM OR PROJECT' --contact 'YOUR EMAIL' \
  --tenant-admin-pubkey-file "$AAC_ONBOARDING_DIR/tenant-admin.pub.pem" \
  --idp github --output table

aac sso login --profile "$AAC_PROFILE"
aac sso whoami --profile "$AAC_PROFILE" --output table
export AAC_TENANT_ID="$(aac profile show "$AAC_PROFILE" | python -c 'import json,sys; print(json.load(sys.stdin)["binding"]["tenant_id"])')"
aac tenant describe --profile "$AAC_PROFILE" --tenant-id "$AAC_TENANT_ID" --output table
```

Follow the CLI's browser/device instructions. AAC assigns the `tnt-<uuid>`
identifier; there is no user-chosen `--tenant-id` on registration. The CLI
shows the API-key value once, stores it with mode `0600` under
`~/.aac/credentials/<tenant-id>`, and binds the profile. Save a protected copy
in your secret manager. A bound profile refuses a second registration; create
a different profile for a different tenant. If a registration response is
interrupted, use the same profile and follow the CLI's resume instruction;
do not create a competing registration to recover the response.

### Bind your trust domain and register the workload

AAC assigns your tenant a trust domain, so you need no DNS name and no TXT
record. Assigning it and registering a workload are separate operations; run
them in this order:

```bash
AAC_TRUST_DOMAIN="$(aac tenant assign-hosted-domain --profile "$AAC_PROFILE" \
  | python -c 'import json,sys; print(json.load(sys.stdin)["trust_domain"])')"
export AAC_TRUST_DOMAIN
echo "$AAC_TRUST_DOMAIN"
aac tenant list-trust-domains --profile "$AAC_PROFILE" --output table
aac tenant add-workload --profile "$AAC_PROFILE" \
  --spiffe-id "spiffe://${AAC_TRUST_DOMAIN}/demo/agent" --display-name 'Synthetic demo agent'
aac tenant list-workloads --profile "$AAC_PROFILE" --output table
```

The assigned domain is built from your tenant identifier and looks like
`tnt-<uuid>.tenants.stage.cascadeauth.dev`. Registration itself usually assigns
it already and prints it, so the command above normally reads that same domain
back; it is idempotent and safe to rerun. If a previous hosted binding was
revoked, reactivate it with `aac tenant reactivate-hosted-domain` before
registering a workload. Workload registration records the identity only; your
tenant's PKI/SPIFFE system still issues its certificate and matching private
key.

#### Use a DNS domain of your own instead

Optional, and only if your tenant must be identified by its own name, such as
`agents.example.com`. It needs a DNS name you control and a published TXT
record. Use your actual canonical lowercase DNS name:

```bash
export AAC_TRUST_DOMAIN=agents.example.com
aac tenant issue-domain-challenge --profile "$AAC_PROFILE" --domain "$AAC_TRUST_DOMAIN"
```

Publish the exact TXT name/value returned by that command at your DNS provider,
wait for propagation, then bind it and register the workload under it. Run these
lines rather than the block above, whose first line would replace
`AAC_TRUST_DOMAIN` with the assigned domain:

```bash
aac tenant verify-domain --profile "$AAC_PROFILE" --domain "$AAC_TRUST_DOMAIN"
aac tenant bind-trust-domain --profile "$AAC_PROFILE" --trust-domain "$AAC_TRUST_DOMAIN"
aac tenant add-workload --profile "$AAC_PROFILE" \
  --spiffe-id "spiffe://${AAC_TRUST_DOMAIN}/demo/agent" --display-name 'Synthetic demo agent'
aac tenant list-workloads --profile "$AAC_PROFILE" --output table
```

Issuing a new challenge replaces the prior challenge; retain the current TXT
record while the binding needs domain evidence. Existing or previously revoked
bindings follow their lifecycle rules, so an ownership/history rejection needs
operator resolution. Do not retry it with a bootstrap token or invent a tenant
ID.

### Keep credential roles separate

Every key, certificate and shared secret this guide creates is described in one
place: **[Keys and certificates](https://cascadeauth.github.io/aac-starter-guide/keys-and-certificates.html)**. That page says
what each item proves, where it lives, who gets a copy and how long it lasts, and
it covers both ways an agent gets its certificates — a development authority
created for you, or your own issuer's. Read it before you generate anything.

Two rules the rest of this section depends on. Use Ed25519 or P-256 keys and
currently valid, matching SPIFFE certificates; your CA bundle must validate the
workload and terminal certificates for the bound domain. And keep pairing secrets
distinct from every signing key: for a managed deployment, generate one in a new
protected location with `umask 077; openssl rand -hex 32 > invoke-auth.secret`,
then install it privately in both processes. The development recipe below
generates its own.

### Generate development PKI

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


### Publish public trust material

For a file-backed demonstration, create a root-signing key and public half in
your private onboarding directory, then copy **only the public half** into the
publisher's root-key directory:

```bash
export AAC_ROOT_KEY_ID=demo-root-v1
test ! -e "$AAC_ONBOARDING_DIR/${AAC_ROOT_KEY_ID}.pem"
openssl genpkey -algorithm ed25519 -out "$AAC_ONBOARDING_DIR/${AAC_ROOT_KEY_ID}.pem"
openssl pkey -in "$AAC_ONBOARDING_DIR/${AAC_ROOT_KEY_ID}.pem" \
  -pubout -out "$AAC_ONBOARDING_DIR/${AAC_ROOT_KEY_ID}.pub.pem"
mkdir -p "$AAC_ONBOARDING_DIR/root-public"
cp "$AAC_ONBOARDING_DIR/${AAC_ROOT_KEY_ID}.pub.pem" "$AAC_ONBOARDING_DIR/root-public/"

export AAC_TAP_TENANT_ID="$AAC_TENANT_ID"
export AAC_TAP_ADMIN_KEY_FILE="$AAC_ONBOARDING_DIR/tenant-admin.pem"
export AAC_TAP_ROOT_KEYS_DIR="$AAC_ONBOARDING_DIR/root-public"
export AAC_TAP_ROOT_KEYS_INGEST_URL=https://api.stage.cascadeauth.dev/v1/root-keys/ingest
export AAC_TAP_POLL_INTERVAL_SECONDS=60
aac-trust-anchor-publisher
```

This runs the installed publisher in the foreground. Run one active writer for
your tenant's root keys and one per active domain binding, and never two
competing writers for the same root set or binding, to avoid uncoordinated
ingest sequence changes. The public filename
stem is the root key ID; configure `tenant.key_id: demo-root-v1` and mount the
private half only into the workload. Rotation gets a new key ID.
Successfully ingested public material remains stored after the publisher exits;
the serving cache TTL is not a key-expiry timer. Run the publisher again when
keys or CA bundles change, following their rotation/revocation lifecycle.

To enable SPIFFE-bundle publication, stop the foreground publisher, place
**public CA certificates only** in a separate directory using filenames
`<anchor_id>.ca.pem`, and add these settings in the same shell before
restarting that one publisher. The trust-domain binding must already be active.

```bash
export AAC_TAP_SPIFFE_BUNDLE_DIR="$AAC_ONBOARDING_DIR/spiffe-ca-public"
# Populate this directory with your issuer's public <anchor_id>.ca.pem files.
export AAC_TAP_SPIFFE_TRUST_DOMAIN="$AAC_TRUST_DOMAIN"
export AAC_TAP_SPIFFE_BUNDLE_INGEST_URL=https://api.stage.cascadeauth.dev/v1/spiffe-bundle/ingest
export AAC_TAP_SPIFFE_BUNDLE_READ_URL="https://trust.stage.cascadeauth.dev/.well-known/spiffe-bundle/${AAC_TRUST_DOMAIN}"
aac-trust-anchor-publisher
```

For the development PKI above, set `AAC_TAP_SPIFFE_BUNDLE_DIR` to
`"$AAC_DEMO_DIR/publish-ca"` instead. That directory contains only the public
development CA certificate. Never point the publisher at `pki/`.

Check the public bundle at the configured read URL and root keys at
`https://trust.stage.cascadeauth.dev/.well-known/aac-root-keys/<tenant-id>`.
Do not send a CA private key or workload private key to the publisher.

In another terminal, confirm ingest and public key visibility:

```bash
aac trust-anchor ingest-history --profile "$AAC_PROFILE" --output table
aac trust-anchor list --profile "$AAC_PROFILE" --output table
```

Only proceed to the runnable example when the expected root key and SPIFFE CA
bundle are visible, your workload projection is registered, and all configured
key/certificate pairs are valid. A successful registration by itself does not
complete this preparation.

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

## Optional runnable paired-agent example

Use this synthetic example with a **prepared test tenant** and the sidecar
configuration below. It performs no payment, trade, or other business action.
Its human-originator fields are explicitly synthetic input, not proof of a
GitHub, Google, or other identity-provider sign-in. A real originator must take
those fields from its authenticated application context.

This example uses a small Python/FastAPI application. If you already have an
agent, integrate pairing authentication into its existing handler and server.

### Install the optional sample application server

In the same virtual environment used for the companion tools:

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
`AAC_TRUST_DOMAIN`, `AAC_ONBOARDING_DIR` and `AAC_DEMO_DIR` in your shell.
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
base = Path(os.environ['AAC_DEMO_DIR']).expanduser().resolve()
onboarding = Path(os.environ['AAC_ONBOARDING_DIR']).expanduser().resolve()
tenant = os.environ['AAC_TENANT_ID']
domain = os.environ['AAC_TRUST_DOMAIN']
if not re.fullmatch(r'tnt-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}', tenant):
    raise SystemExit('Use the tenant ID returned by registration')
if not re.fullmatch(r'[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?', domain):
    raise SystemExit('Use your assigned or verified lowercase trust domain')
spiffe = f'spiffe://{domain}/demo/agent'
key_id = os.environ.get('AAC_ROOT_KEY_ID', 'demo-root-v1')
root_key = onboarding / (key_id + '.pem')
api_key = Path(os.environ.get('AAC_API_KEY_FILE', str(Path.home()/'.aac/credentials'/tenant))).expanduser().resolve()
pki = base/'pki'
required = [root_key, api_key, *[pki/name for name in
    ('workload.key', 'workload.crt', 'terminal.key', 'terminal.crt',
     'server.key', 'server.crt', 'outbound-ca.pem', 'pairing.secret')]]
if any(not p.is_file() or not p.stat().st_size for p in required):
    raise SystemExit('Prepare every credential file before creating the configuration')
if not (base/'state').is_dir():
    raise SystemExit('Run development PKI setup first')
config = {
    'schema_version': '1.0',
    'replay_protection': {'backend': 'memory', 'deployment_profile': 'basic', 'memory_max_entries': 100000},
    'sidecar': {
        'dev_mode': True, 'loopback_bind_address': '127.0.0.1', 'loopback_port': 8080,
        'external_bind_address': '127.0.0.1', 'external_port': 9443,
        'agent_invoke_url': 'http://127.0.0.1:8000/invoke',
        'agent_invoke_auth': {'secret_file': str(pki/'pairing.secret')},
        'tls_cert_file': str(pki/'server.crt'), 'tls_key_file': str(pki/'server.key'),
        'tls_ca_file': str(pki/'outbound-ca.pem'), 'log_level': 'info',
        'telemetry': {'sink': str(base/'state/telemetry.jsonl')},
    },
    'tenant': {'id': tenant, 'key_id': key_id,
               'signing_key_file': str(root_key), 'signing_key_algorithm': 'ed25519'},
    'agent': {'spiffe_id': spiffe, 'svid_key_file': str(pki/'workload.key'),
              'svid_cert_file': str(pki/'workload.crt'),
              'attestation_key_file': str(pki/'terminal.key'),
              'attestation_cert_file': str(pki/'terminal.crt')},
    'trust_anchors': {'source': 'control_plane',
                      'control_plane_url': 'https://trust.stage.cascadeauth.dev',
                      'tenant_ids': [tenant]},
    'spiffe_bundles': {'source': 'control_plane',
                       'control_plane_url': 'https://trust.stage.cascadeauth.dev',
                       'trust_domains': [domain]},
    'workload_projection': {'source': 'control_plane',
                            'control_plane_url': 'https://api.stage.cascadeauth.dev',
                            'api_key_file': str(api_key)},
    'a2a': {'public_base_url': 'https://127.0.0.1:9443',
            'local_handler_url': 'http://127.0.0.1:8000/a2a/v1',
            'max_request_body_bytes': 262144, 'deadline_seconds': 60,
            'max_concurrent_requests': 20, 'max_json_nesting_depth': 32,
            'max_json_nodes': 10000, 'continuation_authority': {'retention_seconds': 600},
            'egress_idempotency': {'state_file': str(base/'state/a2a-egress.db'),
                                   'retention_seconds': 86400, 'max_entries_per_pair': 4096,
                                   'max_cached_response_body_bytes': 4096,
                                   'max_reserved_cached_bytes_per_pair': 16777216}},
    'classes_of_action': {'demo_verify': {'predicates': {'action': 'dev_noop'},
                                         'valid_for': '+10m', 'audience_self': spiffe}},
    'destinations': {name: {'url': 'https://127.0.0.1:9443'+path,
                           'audience_pattern': spiffe, 'predicates': {'action': 'dev_noop'},
                           'valid_for': '+5m', 'timeout_ms': 10000}
                     for name, path in [('self_receive', '/v1/agent/receive'), ('self_a2a', '/a2a/v1')]},
}
with (base/'sidecar-config.yaml').open('x') as stream:
    yaml.safe_dump(config, stream, sort_keys=False)
print('Created complete configuration:', base/'sidecar-config.yaml')
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
        return {"action": "forward", "destination": os.environ.get("AAC_DEMO_DESTINATION", "self_receive"),
                "payload": {"step": "settle"},
                "additional_predicates": {"task_ref": body["task_ref"]}}
    if isinstance(payload, dict) and payload.get("step") == "settle":
        return {"action": "settle", "settlement_id": body["task_ref"],
                "action_summary": "Completed synthetic demonstration; no business effect."}
    return {"action": "refuse", "reason": "Demo agent has no other business policy."}

@app.post("/invoke")
async def invoke(request: Request):
    return sample_decision(await request.json())

@app.post("/a2a/v1")
async def a2a(request: Request):
    body = await request.json()
    # The sidecar admits only the supported unary SendMessage profile here.
    return {"jsonrpc": "2.0", "id": body["id"], "result": {"message": {
        "messageId": body["params"]["message"]["messageId"] + "-reply",
        "contextId": "demo-" + body["params"]["message"]["messageId"],
        "role": "ROLE_AGENT", "parts": [{"text": "Synthetic AAC-authorized reply"}]}}}
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
    human = {"iss": "https://synthetic.invalid", "sub": "demo-only",
             "auth_time_unix_seconds": int(time.time())}
    path = "/v1/agent/mint-root"
    body = json.dumps({"human_originator": human, "class_of_action": "demo_verify",
        "task_ref": task, "payload": {"step": "forward"}}, separators=(",", ":")).encode()
    headers = {"Content-Type": "application/json"}
    headers.update(sign_invoke_request(secret=secret, method="POST", path=path,
                                       headers=headers, body=body))
    response = originator.post(path, headers=headers, content=body)
    response.raise_for_status()
    minted = response.json()
    if minted.get("delivery_status") != "delivered":
        raise RuntimeError("native workflow was not delivered")

    path = "/v1/agent/a2a/dispatch"
    dispatch_id = str(uuid.uuid4())
    envelope = {"schema_version": "aac.a2a.egress.v1",
        "dispatch_id": dispatch_id, "destination_profile": destination_profile,
        "task_ref": task + "-a2a",
        "authority": {"mode": "originate", "class_of_action": "demo_verify",
                      "human_originator": human},
        "additional_predicates": {},
        "a2a_request": {"jsonrpc": "2.0", "id": task, "method": "SendMessage",
            "params": {"message": {"messageId": str(uuid.uuid4()),
                       "role": "ROLE_USER", "parts": [{"text": "Synthetic hello"}]}}}}
    body = json.dumps(envelope, separators=(",", ":")).encode()

    def send():
        headers = {"Content-Type": "application/json",
                   "X-AAC-Envelope-Schema": "aac.a2a.egress.v1"}
        headers.update(sign_invoke_request(secret=secret, method="POST",
                                           path=path, headers=headers, body=body))
        result = client.post(path, headers=headers, content=body)
        result.raise_for_status()
        if "error" in result.json():
            raise RuntimeError("A2A returned a protocol error")
        return result

    first = send()
    retry = send()  # Same dispatch_id AND same envelope; fresh pairing signature.
    if retry.content != first.content:
        raise RuntimeError("identical A2A retry returned different bytes")
    return {"native_delivery": "delivered", "task_ref": task,
            "root_token_id": minted["root_token_id"],
            "a2a_dispatch_id": dispatch_id, "a2a_retry": "same response bytes"}


if __name__ == "__main__":
    secret = Path(os.environ["AAC_INVOKE_AUTH_SECRET_FILE"]).read_bytes().strip()
    tls = ssl.create_default_context(cafile=os.environ["AAC_DEMO_CA_FILE"])
    with httpx.Client(base_url="http://127.0.0.1:8080", timeout=65, trust_env=False) as client:
        with httpx.Client(base_url="https://127.0.0.1:9443", verify=tls, timeout=65, trust_env=False) as originator:
            print(json.dumps(run_demo(client, secret, originator,
                os.environ.get("AAC_DEMO_A2A_DESTINATION", "self_a2a")), indent=2))
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
base=Path(os.environ['AAC_DEMO_DIR']).expanduser().resolve()
config=yaml.safe_load((base/'sidecar-config.yaml').read_text())
for name in ('agent.py','demo_client.py'):
    if not (base/name).is_file():
        raise SystemExit('Save both example applications before staging')
stage=base/'container';stage.mkdir()
for name in ('sidecar','agent','pair','state'):(stage/name).mkdir()
def stage_key(source,name):
    shutil.copyfile(source,stage/'sidecar'/name)
    return '/etc/aac/'+name
config['tenant']['signing_key_file']=stage_key(config['tenant']['signing_key_file'],'root.pem')
for field,name in [('svid_key_file','workload.key'),('svid_cert_file','workload.crt'),
                   ('attestation_key_file','terminal.key'),('attestation_cert_file','terminal.crt')]:
    config['agent'][field]=stage_key(config['agent'][field],name)
for field,name in [('tls_key_file','server.key'),('tls_cert_file','server.crt'),('tls_ca_file','outbound-ca.pem')]:
    config['sidecar'][field]=stage_key(config['sidecar'][field],name)
config['workload_projection']['api_key_file']=stage_key(config['workload_projection']['api_key_file'],'tenant-api-key')
shutil.copyfile(base/'pki/pairing.secret',stage/'pair/pairing.secret')
shutil.copyfile(base/'pki/dev-ca.crt',stage/'pair/dev-ca.crt')
config['sidecar']['agent_invoke_auth']['secret_file']='/run/secrets/pairing.secret'
config['sidecar']['telemetry']['sink']='/var/lib/aac/telemetry.jsonl'
config['a2a']['egress_idempotency']['state_file']='/var/lib/aac/a2a-egress.db'
(stage/'sidecar/sidecar-config.yaml').write_text(yaml.safe_dump(config,sort_keys=False))
for name in ('agent.py','demo_client.py'):shutil.copyfile(base/name,stage/'agent'/name)
(stage/'agent/Dockerfile').write_text('''FROM python:3.12-slim
RUN python -m pip install --no-cache-dir aac-invoke-auth[fastapi] uvicorn httpx
WORKDIR /app
COPY agent.py demo_client.py /app/
RUN chmod 0444 /app/*.py
ENV PYTHONDONTWRITEBYTECODE=1
USER 65532:65532
CMD ["python", "-m", "uvicorn", "agent:app", "--host", "127.0.0.1", "--port", "8000"]
''')
print('Created container configuration and sample application build directory')
```
<!-- container-config-example:end -->

Build the sample **application** image locally and pull the published sidecar:

```bash
cd "$AAC_DEMO_DIR"
python configure_container.py
docker build --tag aac-demo-agent "$AAC_DEMO_DIR/container/agent"
docker pull docker.io/cascadeauth/aac-sidecar:v0.4.4
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
  docker.io/cascadeauth/aac-sidecar:v0.4.4 -config /etc/aac/sidecar-config.yaml
docker logs --tail 30 aac-demo-agent
docker logs --tail 30 aac-demo-sidecar
docker exec aac-demo-agent python -c 'import urllib.request; print(urllib.request.urlopen("http://127.0.0.1:8080/readyz").read().decode())'
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
base = Path(os.environ['AAC_DEMO_DIR']).expanduser().resolve()
config = yaml.safe_load((base/'sidecar-config.yaml').read_text())
domain = config['agent']['spiffe_id'].split('/')[2]
peer_spiffe = f'spiffe://{domain}/demo/peer'
ca = x509.load_pem_x509_certificate((base/'pki/dev-ca.crt').read_bytes())
ca_key = serialization.load_pem_private_key((base/'pki/dev-ca.key').read_bytes(), None)
now = dt.datetime.now(dt.timezone.utc)
if not isinstance(ca_key, ed25519.Ed25519PrivateKey) or ca.not_valid_after_utc <= now+dt.timedelta(hours=1):
    raise SystemExit('Use a currently valid CA from the development PKI recipe')
public_bytes=lambda key:key.public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
if public_bytes(ca_key.public_key()) != public_bytes(ca.public_key()) or ca.not_valid_before_utc > now:
    raise SystemExit('Development CA certificate/key mismatch or CA is not yet valid')
if (base/'sidecar-A.yaml').exists() or (base/'peer').exists():
    raise SystemExit('Peer configuration already exists; inspect it before changing it')
peer = base/'peer'; peer.mkdir()
(peer/'pki').mkdir(); (peer/'state').mkdir()
def issue(name, identity=None):
    key = ed25519.Ed25519PrivateKey.generate() if identity and name == 'workload' else ec.generate_private_key(ec.SECP256R1())
    subject = x509.Name([]) if identity else x509.Name([x509.NameAttribute(NameOID.COMMON_NAME, 'localhost')])
    sans = [x509.UniformResourceIdentifier(identity)] if identity else [x509.IPAddress(ipaddress.ip_address('127.0.0.1')), x509.DNSName('localhost')]
    cert = (x509.CertificateBuilder().subject_name(subject).issuer_name(ca.subject)
        .public_key(key.public_key()).serial_number(x509.random_serial_number())
        .not_valid_before(now-dt.timedelta(seconds=5))
        .not_valid_after(min(now+dt.timedelta(days=1), ca.not_valid_after_utc))
        .add_extension(x509.BasicConstraints(ca=False, path_length=None), critical=True)
        .add_extension(x509.KeyUsage(True, False, False, False, False, False, False, False, False), critical=True)
        .add_extension(x509.ExtendedKeyUsage([ExtendedKeyUsageOID.CLIENT_AUTH, ExtendedKeyUsageOID.SERVER_AUTH] if identity else [ExtendedKeyUsageOID.SERVER_AUTH]), critical=False)
        .add_extension(x509.SubjectAlternativeName(sans), critical=bool(identity)).sign(ca_key, None))
    (peer/'pki'/f'{name}.key').write_bytes(key.private_bytes(serialization.Encoding.PEM, serialization.PrivateFormat.PKCS8, serialization.NoEncryption()))
    (peer/'pki'/f'{name}.crt').write_bytes(cert.public_bytes(serialization.Encoding.PEM))
issue('workload', peer_spiffe); issue('terminal', peer_spiffe); issue('server')
(peer/'pki/pairing.secret').write_text(secrets.token_hex(32)+'\n')
(peer/'pki/outbound-ca.pem').write_bytes((base/'pki/outbound-ca.pem').read_bytes())
(peer/'pki/dev-ca.crt').write_bytes((base/'pki/dev-ca.crt').read_bytes())
sender, receiver = copy.deepcopy(config), copy.deepcopy(config)
sender['sidecar']['telemetry']['sink'] = str(base/'state/telemetry-A.jsonl')
sender['a2a']['egress_idempotency']['state_file'] = str(base/'state/a2a-egress-A.db')
sender['destinations'] = {name: {'url':'https://127.0.0.1:9444'+path,
    'audience_pattern':peer_spiffe, 'predicates':{'action':'dev_noop'},
    'valid_for':'+5m', 'timeout_ms':10000}
    for name,path in [('peer_receive','/v1/agent/receive'),('peer_a2a','/a2a/v1')]}
receiver['tenant'].pop('signing_key_file')
receiver['agent'].update(spiffe_id=peer_spiffe,
    svid_key_file=str(peer/'pki/workload.key'), svid_cert_file=str(peer/'pki/workload.crt'),
    attestation_key_file=str(peer/'pki/terminal.key'), attestation_cert_file=str(peer/'pki/terminal.crt'))
receiver['sidecar'].update(loopback_port=8081, external_port=9444,
    agent_invoke_url='http://127.0.0.1:8001/invoke',
    agent_invoke_auth={'secret_file':str(peer/'pki/pairing.secret')},
    tls_cert_file=str(peer/'pki/server.crt'), tls_key_file=str(peer/'pki/server.key'),
    tls_ca_file=str(peer/'pki/outbound-ca.pem'), telemetry={'sink':str(peer/'state/telemetry-B.jsonl')})
receiver['a2a'].update(public_base_url='https://127.0.0.1:9444', local_handler_url='http://127.0.0.1:8001/a2a/v1')
receiver['a2a']['egress_idempotency']['state_file'] = str(peer/'state/a2a-egress.db')
receiver['classes_of_action'] = {}; receiver['destinations'] = {}
with (base/'sidecar-A.yaml').open('x') as f: yaml.safe_dump(sender, f, sort_keys=False)
with (peer/'sidecar-B.yaml').open('x') as f: yaml.safe_dump(receiver, f, sort_keys=False)
print('Created sidecar-A.yaml and peer/sidecar-B.yaml')
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

ORDER = int('FFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551', 16)
def require(ok, message):
    if not ok:
        raise ValueError(message)

def unb64(value):
    require(bool(re.fullmatch(r'[A-Za-z0-9_-]+', value)), 'Invalid base64url')
    return base64.urlsafe_b64decode(value + '=' * (-len(value) % 4))

def verify(compact, ca_pem, tenant, spiffe, root, task, at):
    require(len(compact) <= 65536, 'Attestation too large')
    parts = compact.split('.')
    require(len(parts) == 3, 'Expected compact JWS')
    header, claims = [json.loads(unb64(p)) for p in parts[:2]]
    require(isinstance(header, dict) and isinstance(claims, dict), 'Expected JSON objects')
    require(header.get('typ') == 'aac-terminal-attestation+jwt' and 'crit' not in header, 'Unsupported protected header')
    require(header.get('alg') in ('EdDSA', 'ES256'), 'Unsupported algorithm')
    chain = header.get('x5c')
    require(isinstance(chain, list) and len(chain) == 1, 'Expected one x5c leaf')
    leaf = x509.load_der_x509_certificate(base64.b64decode(chain[0], validate=True))
    public = leaf.public_key()
    spki = public.public_bytes(serialization.Encoding.DER, serialization.PublicFormat.SubjectPublicKeyInfo)
    kid = base64.urlsafe_b64encode(hashlib.sha256(spki).digest()).rstrip(b'=').decode()
    require(header.get('kid') == kid, 'Leaf-key fingerprint mismatch')
    uris = leaf.extensions.get_extension_for_class(x509.SubjectAlternativeName).value.get_values_for_type(x509.UniformResourceIdentifier)
    require([u for u in uris if u.startswith('spiffe://')] == [spiffe], 'Unexpected workload identity')
    def valid(cert):
        return cert.not_valid_before_utc.timestamp()-30 <= at <= cert.not_valid_after_utc.timestamp()+30
    require(valid(leaf), 'Leaf outside certificate validity')
    trusted = False
    for ca in x509.load_pem_x509_certificates(ca_pem):
        if not valid(ca):
            continue
        key = ca.public_key()
        try:
            if isinstance(key, ed25519.Ed25519PublicKey) and leaf.signature_algorithm_oid == SignatureAlgorithmOID.ED25519:
                key.verify(leaf.signature, leaf.tbs_certificate_bytes)
            elif isinstance(key, ec.EllipticCurvePublicKey) and isinstance(key.curve, ec.SECP256R1) and leaf.signature_algorithm_oid == SignatureAlgorithmOID.ECDSA_WITH_SHA256:
                key.verify(leaf.signature, leaf.tbs_certificate_bytes, ec.ECDSA(hashes.SHA256()))
            else:
                continue
            trusted = True
            break
        except Exception:
            continue
    require(trusted, 'Leaf not signed by a currently valid trusted CA')
    signature = unb64(parts[2]); data = '.'.join(parts[:2]).encode('ascii')
    require(len(signature) == 64, 'Expected 64-byte signature')
    if header['alg'] == 'EdDSA':
        require(isinstance(public, ed25519.Ed25519PublicKey), 'Algorithm/key mismatch')
        public.verify(signature, data)
    else:
        require(isinstance(public, ec.EllipticCurvePublicKey) and isinstance(public.curve, ec.SECP256R1), 'Algorithm/key mismatch')
        r, s = int.from_bytes(signature[:32], 'big'), int.from_bytes(signature[32:], 'big')
        require(0 < r < ORDER and 0 < s <= ORDER//2, 'Invalid or noncanonical ES256 signature')
        public.verify(encode_dss_signature(r, s), data, ec.ECDSA(hashes.SHA256()))
    expected = {'iss': tenant, 'terminal_agent_svid': spiffe, 'root_token_id': root, 'task_ref': task}
    require(isinstance(root, str) and bool(root), 'Expected root must be nonempty')
    for name, value in expected.items():
        require(claims.get(name) == value, 'Claim mismatch: '+name)
    require(bool(re.fullmatch(r'tnt-[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}', tenant)), 'Invalid expected tenant')
    require(type(claims.get('iat')) is int and -(2**63) <= claims['iat'] < 2**63, 'Invalid issued-at time')
    require(isinstance(claims.get('settlement_id'), str) and bool(claims['settlement_id']), 'Missing settlement ID')
    require('action_summary' not in claims or isinstance(claims['action_summary'], str), 'Invalid action summary')
    return {'verified': True, **expected, 'settlement_id': claims['settlement_id']}

def read_compact(path):
    with Path(path).open('rb') as stream:
        raw = stream.read(65537)
    require(len(raw) <= 65536, 'Attestation file exceeds 64 KiB')
    return raw.decode('ascii').strip()

if __name__ == '__main__':
    p = argparse.ArgumentParser()
    for flag in ('jws', 'ca', 'tenant', 'spiffe', 'root', 'task'):
        p.add_argument('--'+flag, required=True)
    p.add_argument('--at', type=int, default=None)
    a = p.parse_args()
    result = verify(read_compact(a.jws), Path(a.ca).read_bytes(), a.tenant,
                    a.spiffe, a.root, a.task, int(time.time()) if a.at is None else a.at)
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


## Alternative standalone-binary installation with ORAS

Use this alternative to the sidecar container for a bare VM, systemd host,
or macOS development machine. Container users can also download the bundle
for offline documentation or deep audit without installing its standalone binary.
[Install ORAS](https://oras.land/docs/installation/) to download the files and
[install Cosign](https://docs.sigstore.dev/cosign/system_config/installation/) to
verify their signatures. Neither tool is needed to run the sidecar afterward.

```bash
mkdir aac-sidecar-v0.4.4
cd aac-sidecar-v0.4.4
bundle_ref=docker.io/cascadeauth/aac-sidecar:v0.4.4-bundle
bundle_digest="$(oras resolve "${bundle_ref}")"
[[ "${bundle_digest}" =~ ^sha256:[0-9a-f]{64}$ ]]

cosign verify \
  --certificate-identity 'https://github.com/CascadeAuth/aac-sidecar-go/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  "docker.io/cascadeauth/aac-sidecar@${bundle_digest}"

oras pull "docker.io/cascadeauth/aac-sidecar@${bundle_digest}"

cosign verify-blob \
  --certificate-identity 'https://github.com/CascadeAuth/aac-sidecar-go/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle checksums.txt.bundle \
  checksums.txt

bash ./verify-developer-beta.sh . v0.4.4
```

### Optional deep artifact audit

For a reproducible audit beyond signature/checksum verification, install
Python 3.10+ and Go, then run
this **after** the Cosign verification above:

```bash
python3 --version
go version
bash ./verify-developer-beta.sh . v0.4.4 --deep-audit
```

Go reads embedded build metadata from each binary; it does not execute foreign-platform
binaries. The verifier's final version check executes only your host's binary.
The optional audit checks:

- All four platform archives, exact file sets and matching license/notices/guide.
- Binary platform, Go build metadata, version/commit, `-trimpath` and disabled
  CGO; Linux ELF symbol/debug-section absence and private-source/key markers.
- The OCI archive's two Linux platforms, complete referenced SHA-256 blob graph,
  descriptor lengths, runtime user/entrypoint, release labels, legal files and
  application-layer file set; every layer is scanned for forbidden source/key
  markers without extracting it into your filesystem.
- SPDX 2.3 identifiers/relationships and its four binary SHA-256 values against
  the standalone archives.
- in-toto/SLSA version, commit, targets, builder/tool identity and every public
  subject digest against the signed checksum manifest.

It prints a JSON audit summary with the binary hashes and inventory counts.
Archive bounds fail closed if an input exceeds the supported release profile.
The audit verifies the signed build metadata and artifact contents; it does
not reproduce the build. A green audit does not replace
Cosign identity verification, runtime readiness, or your tenant's qualification.

Select only the archive for the current platform. Default developer install:

```bash
version=v0.4.4
platform=linux_amd64  # or linux_arm64, darwin_amd64, darwin_arm64
install_root="${HOME}/.local/lib/aac-sidecar/releases/${version}"

mkdir -p "${install_root}" "${HOME}/.local/bin"
tar -xzf "aac-sidecar_${version}_${platform}.tar.gz" -C "${install_root}"
ln -sfn "${install_root}/aac-sidecar" "${HOME}/.local/bin/aac-sidecar"
"${HOME}/.local/bin/aac-sidecar" -version
```

For an Ubuntu ARM64 VM (`uname -m` returns `aarch64`), select `linux_arm64`,
not the `linux_amd64` default in the example. Install Cosign and ORAS in the
verification environment before this standalone path; the container path also
uses Docker's Buildx plugin for digest inspection. Do not overwrite an existing
installation or delete unrelated services to make the destination appear clean.

For an operator-managed production service, `/opt/aac/sidecar/releases/<version>`
may be root-owned, but the service process itself must run as a dedicated
non-root account. Do not default a developer install to a root-owned directory.

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
rm -rf "${HOME}/.local/lib/aac-sidecar/releases/v0.4.4"
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

## Beta boundary and contact

This beta is for evaluation and integration development, not production or
safety-critical use. There is no production SLA or guaranteed throughput.
Use the included license for permitted use and redistribution terms.

- Usage and integration questions: `support@cascadeauth.com`
- Legal notices: `legal@cascadeauth.com`

## Execution graphs

Use the [Agent Execution Graph guide](https://cascadeauth.github.io/aac-starter-guide/aeg.html)
for installation, local run discovery, and rendering local and authorized central
evidence into self-contained HTML. The public reservation demo prints actual
input paths and the render command for each attempt. Application records stay
local; central metadata cannot supply private business results.

## Release notes

[Read release notes and upgrade guidance](release-notes.html).
