# Configure the sidecar

[Start the AAC journey](https://docs.cascadeauth.com/get-started/) · [All references](https://docs.cascadeauth.com/sidecar/configuration/)

This reference is for a deployment or integration you have chosen to configure.
For the first authenticated reservation, use the packaged Compose journey above.

## One tenant with many production agents

This section explains the production deployment model. The public developer-beta
binary license permits evaluation and integration development with stage; it
does not grant production or third-party service use.

Register the tenant once, establish its administrator and any enterprise IdP
connection/recovery path, and protect the tenant-admin signing key. Publish
the tenant's CA certificates and the root public keys of agents that start
tasks. The [CLI user guide](https://docs.cascadeauth.com/cli/)
provides the developer and enterprise registration procedures.

For each agent, register its workload, obtain a matching SPIFFE certificate/key
from your issuer chaining to the published CA, prepare its sidecar config,
private pairing secret and scoped tenant API key, and deploy the pair with
restricted ingress and appropriate persistent state. Give a root-signing key
only to originators and a receipt-signing key to agents that finish tasks.

For a chain of 100 agents where agent n calls agent n+1, first select the
existing tenant's `prod` profile and active assigned or custom trust domain.
Replace `YOUR_ACTIVE_TRUST_DOMAIN` with that domain, then register the workloads:

```bash
AAC_TRUST_DOMAIN='YOUR_ACTIVE_TRUST_DOMAIN'
for n in {1..100}; do
  aac tenant add-workload \
    --profile prod \
    --spiffe-id "spiffe://$AAC_TRUST_DOMAIN/agent-$n" \
    --display-name "Agent $n"
done
```

Issue the corresponding certificates through your tenant issuer. Configure
agents 1–99 with their actual successor's HTTPS endpoint and exact workload
audience, and agent 100 to return the terminal receipt. Agent 1 also needs its
initial class of action. Forwarding narrows the received authority and signs
with the forwarder's identity key. This is a configuration example, not a
100-agent capacity measurement or an automatic deployment command.

| | Agent 1 (starts the task) | Agents 2–100 (receive and forward) |
|---|---|---|
| The sidecar | yes | yes |
| An identity: a SPIFFE ID with a certificate and key from the tenant's own issuer, chaining to the CA the tenant publishes | yes | yes |
| The workload registered with AAC (`aac tenant add-workload --spiffe-id …`, one per agent, scriptable) | yes | yes |
| A root signing key (mints the chain's first authority) | yes | no — a forwarding sidecar narrows the authority it received and signs its proof with its own identity key |
| A receipt-signing (terminal attestation) key | if it finishes tasks | agent 100, which finishes the task |
| The sidecar config, the pairing secret shared with its agent, the tenant API key its sidecar uses to reach AAC | yes | yes |

Once per tenant: registration/admin key and coordinated public trust publishing.
For this chain only agent 1's root public key needs publishing. All 100 agents
need identities; receiving and forwarding does not require an originator key.

The CLI's supplied-material configuration workflow can validate and arrange your
issuer's certificate/key files. It does not become a production CA or provision
remote hosts. For role-specific minimal deployments use the configuration
template and key inventory: do not generate unused originator/terminal keys
merely to fill a generic example. Protect and deliver private material only to
its actual consumer, then verify authenticated calls and receipts before
admitting traffic.

### Publisher ownership with multiple domains

One root-key writer owns the tenant's root set. One SPIFFE writer owns each
active binding. A single process can serve both roles for one domain; another
domain requires a separate publisher process with its own public-CA directory.

| Setting / authority | Publisher A | Publisher B |
|---|---|---|
| Tenant ID | Same tenant | Same tenant |
| SPIFFE trust domain | AAC-assigned domain | Proven custom domain |
| SPIFFE bundle directory | Assigned-domain public CA anchors | Custom-domain public CA anchors |
| SPIFFE ingest/read URLs | Ingest URL and assigned-domain read URL | Ingest URL and custom-domain read URL |
| Root-key role | Root public-key directory and ingest URL | Both `AAC_TAP_ROOT_KEYS_DIR` and `AAC_TAP_ROOT_KEYS_INGEST_URL` unset |

Both use authorized tenant-admin signing credentials and discover their own
active binding version. Root sequences are tenant-scoped; SPIFFE sequences are
binding-episode scoped. Never start competing writers for either scope. The
publisher receives public root/CA material and its administration credential,
never a CA private key or workload signing private key. Adding a custom domain
does not rename existing workload identities; register and issue new identities
deliberately while retaining any hosted workloads you still need.

## Installation artifacts inventory

Choose **one sidecar installation format**: the container for Docker/Kubernetes,
or a standalone binary for a VM, systemd host or macOS. The remaining artifacts
serve tenant administration, public-trust publication and workload integration.
They do not all need to be installed on every workload host. For the
trust anchor publisher, choose **one deployment option** as well: its Docker
container or Python package. Both run the same daemon. Run one writer for
your tenant's root keys and one for each active domain binding, reusing an
existing publisher where available: a tenant with a single trust domain needs
one process, and a tenant that keeps its assigned domain and adds its own runs
two, with root-key publishing enabled in exactly one of them.

The package pages and downloads below are public. Installing these artifacts
does not require a GitHub, Docker Hub or PyPI account. Registering and managing
your AAC tenant does require the sign-in described in
[Register your developer tenant](#register-your-developer-tenant) below.

| Artifact | Package or registry location | Type | When to install |
|---|---|---|---|
| AAC CLI | [aac-cli](https://pypi.org/project/aac-cli/) on PyPI | Command-line administration tool | Used by the tenant operator for this guide's onboarding, credentials, public trust and trace commands. The running sidecar does not depend on the CLI. |
| AAC Sidecar container (default) | [docker.io/cascadeauth/aac-sidecar](https://hub.docker.com/r/cascadeauth/aac-sidecar) | Ready-made Linux container image | Choose this for Docker/Kubernetes. This and the standalone binary below are alternative installations of the same sidecar. |
| Trust anchor publisher Docker container | [ghcr.io/cascadeauth/aac-trust-anchor-publisher](https://github.com/orgs/CascadeAuth/packages/container/package/aac-trust-anchor-publisher) | Containerized public-trust publisher | Choose this for a container host or orchestrator to publish/manage the tenant's public root keys and SPIFFE CA bundle. Docker or the orchestrator manages its lifecycle. |
| Trust anchor publisher Python package (alternative) | [aac-trust-anchor-publisher](https://pypi.org/project/aac-trust-anchor-publisher/) on PyPI | Python wheel that installs the publisher daemon command | Choose this for installation in a host/VM's Python virtual environment; use systemd on a managed Linux host where applicable. It requires Python, unlike the sidecar's compiled standalone binary. |
| AAC Sidecar standalone bundle (alternative) | `oras pull --output ./aac-sidecar-bundle docker.io/cascadeauth/aac-sidecar:v0.5.2-bundle` | Download containing standalone binaries, guide/template and audit evidence | Choose this if you are not using the container. [Install ORAS](https://oras.land/docs/installation/), then follow the [standalone installation steps](https://docs.cascadeauth.com/sidecar/install/#standalone-binary-for-linux-or-macos). Container users can download the template directly from this site. |
| Invoke authentication | [aac-invoke-auth](https://pypi.org/project/aac-invoke-auth/) on PyPI; optional `[fastapi]` extra | Framework-independent Python signing/verification library, with an optional FastAPI/Starlette adapter | Install it in a Python workload that uses these helpers. Use `[fastapi]` for the supplied middleware/dependency integration or the [protocol reference's Python example](https://docs.cascadeauth.com/sidecar/integration/#optional-runnable-paired-agent-example). Other stacks need compatible pairing authentication; they do not need to install this Python package. |

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
and digests are available in the [release record](https://docs.cascadeauth.com/released-components.json).

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
| Standalone | Linux amd64/arm64 and macOS amd64/arm64 (macOS 13 Ventura or later); non-root process |
| Agent pairing | Same network namespace; local `/invoke` and `/a2a/v1` authenticated with the per-pair secret |
| Native A2A | A2A 1.0 unary `SendMessage`; JSON-RPC 2.0; no streaming or general-purpose A2A method support |
| Root and terminal signing | File-backed Ed25519/P-256, or explicit Azure Key Vault Standard software-protected non-exportable P-256 keys |
| Workload DPoP | Local file-backed key matching the SVID; remote DPoP is unsupported |
| Replay | Basic: explicit memory/`basic`, process-local and lost on restart. Shared durable: qualified authenticated-TLS Valkey `ha-retained-write-safe`; no fallback |
| A2A retry state | Needed only when your agent sends A2A messages. Retained private bbolt file, one process owner, holding each dispatch's acknowledgement with the peer's reply for the retention window; storage must be qualified and protected for your deployment |
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

### Receive A2A messages without sending

An agent that only receives A2A messages can leave out both
`a2a.continuation_authority` and `a2a.egress_idempotency`. The sidecar then
verifies and delivers incoming messages and publishes the Agent Card as usual.
Your agent cannot send A2A messages through the sidecar in this mode:
`POST /v1/agent/a2a/dispatch` answers 404, and no retry-state file is needed.

To let your agent send, add both blocks as shown in the configuration
template. Supplying only one of the two stops startup with a message naming
both.

### Describe your agent on its A2A Agent Card

When the `a2a` block is present, the sidecar publishes an Agent Card at
`/.well-known/agent-card.json` on its external listener. Other organizations'
agents and directories read it to learn what your agent is. You can describe
your agent in an optional `a2a.agent_card` block:

```yaml
a2a:
  # ...your existing a2a settings...
  agent_card:
    name: "Travel booking agent"
    description: "Books unpaid reservations."
    version: "2.3"
    provider:
      organization: "Example Travel"
      url: "https://travel.example.com"
    documentation_url: "https://travel.example.com/docs"
    icon_url: "https://travel.example.com/icon.png"
    skills:
      - id: "reserve"
        name: "Reserve a trip"
        description: "Holds a reservation without payment."
        tags: ["travel"]
        examples: ["Hold two seats to Lisbon"]
        input_modes: ["text/plain"]
        output_modes: ["application/json"]
```

| Setting | Meaning | Limit |
|---|---|---|
| `name` | Your agent's name. Default `AAC-enabled agent` | 128 bytes |
| `description` | What your agent does. May span lines | 4096 bytes |
| `version` | Your agent's own version label. Default `unspecified` | 64 bytes |
| `provider` | Your organization: `organization` (128 bytes) and `url`, both required when you give a provider | — |
| `documentation_url`, `icon_url`, `provider.url` | Links shown on the card | 2048 bytes each |
| `skills` | What your agent can do. Replaces the one generic default skill | 32 skills |
| `skills[].id`, `skills[].name` | Required. Ids must be unique | 128 bytes each |
| `skills[].description` | Required. May span lines | 4096 bytes |
| `skills[].tags` | Required, at least one | 32 tags of 64 bytes |
| `skills[].examples` | Optional sample requests. May span lines | 16 examples of 1024 bytes |
| `skills[].input_modes`, `skills[].output_modes` | Optional. Only `text/plain` and `application/json` | — |

Every setting is optional, and an existing configuration needs no change.
Lengths are counted in UTF-8 bytes, and all the text you supply may total at
most 64 KiB. A sidecar older than the release that introduced this block
refuses the `agent_card` key at startup; the release notes say which release
that is.

- **Quote every text value.** An unquoted number, date, `true` or `false`,
  such as `version: 2.3`, stops startup; write `version: "2.3"`.
- **Leave out what you do not want.** An empty or whitespace-only text value,
  or an empty list, is refused rather than guessed at; a key left with no
  value counts as omitted. Tab and line-break characters are allowed only in
  descriptions and examples.
- **Links must start with `https://`**, name a host and carry no username or
  password. The sidecar prints them on the card and never fetches them.
- **You describe; the sidecar states what it enforces.** The interface
  address, capabilities, security requirements and admitted content types
  always come from the sidecar. Any other key, such as `capabilities`, stops
  startup with a message that names it. Listing a content type on a skill only
  describes that skill; it turns nothing on.
- **The card is public.** Put no credentials or private operational detail in
  it. AAC does not verify your descriptive text.
- **Changes need a restart.** The sidecar builds the card once when it
  starts. A client or directory that already fetched the old card keeps its
  copy until it fetches again; a restart cannot make it do so.

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
## Advanced installation guide — container

For optional signature and digest checks, use the [artifact verification](https://docs.cascadeauth.com/sidecar/reference/verification/).

### 1. Place the sidecar beside the workload

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
identity, trust, TLS and pairing setup. See [replay profiles](https://docs.cascadeauth.com/sidecar/integration/#replay-protection-profiles).

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
      # Use the immutable image digest from the published component record.
      image: docker.io/cascadeauth/aac-sidecar@sha256:REPLACE_WITH_SELECTED_DIGEST
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
[sidecar-config.template.yaml](https://docs.cascadeauth.com/sidecar-config.template.yaml),
fill every required path and identifier, and
verify replay, trust and an authenticated workflow before admitting traffic.

Plain Docker may use `--network=container:<agent-container>` to share the
agent's loopback namespace. Ordinary Docker Compose containers have separate
loopback interfaces; widening the sidecar loopback bind is a development-only
posture and requires `dev_mode: true`, so it is not the production recipe.

### 2. Verify process identity and readiness

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

Install the following in the Python agent's environment for the
[protocol reference's optional FastAPI example](https://docs.cascadeauth.com/sidecar/integration/#optional-runnable-paired-agent-example)
or your own FastAPI/Starlette integration. It can use
the same environment for the local example:

```bash
python -m pip install --upgrade 'aac-invoke-auth[fastapi]'
python -m pip show aac-invoke-auth
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

Prefer [aac init](https://docs.cascadeauth.com/cli/) for supported tenant registration and agent setup. It prepares
the tenant-admin key, assigned domain, workload, certificates and configuration
in CLI-managed directories. Start with the [CLI user guide](https://docs.cascadeauth.com/cli/)
for shared GitHub, shared Google and enterprise Microsoft Entra ID onboarding;
the enterprise first connection and recovery verifier are prerequisites to its
normal `init` flow. The [complete command reference](https://docs.cascadeauth.com/cli/reference/)
describes the latest supported released CLI.

Save the guide's agent YAML for your workload, then run its [aac init](https://docs.cascadeauth.com/cli/) command.
Generated CA/leaf material is development-only. The CLI also validates supplied
certificates and keys from your issuer; that choice alone does not qualify a
production deployment. Use [the public reservation demo](https://github.com/CascadeAuth/aac-compose-demo)
for an executed two-tenant example with no user-written inline Python.

#### Optional advanced manual registration

The following lower-level route is for operators who deliberately manage the
material paths themselves; it is not required by the guided setup or demo.
`set -euo pipefail` is Bash error handling. Here it makes the private-key
existence guard stop execution rather than overwrite an existing key.

Choose a new, unbound profile for each tenant. The following example uses the
`stage` profile created above and GitHub sign-in; use `--idp google` for Google.
Your verified identity becomes the first tenant administrator.

Generate a tenant-admin key in a new private directory. The publisher needs
this key to sign ingest requests; it is distinct from the workload's root key.
Do not rerun key generation over an existing key.

```bash
set -euo pipefail
export AAC_PROFILE=stage
export AAC_MATERIAL_DIR="$HOME/aac-material/$AAC_PROFILE"
umask 077
mkdir -p "$AAC_MATERIAL_DIR"
test ! -e "$AAC_MATERIAL_DIR/tenant-admin.pem"
openssl genpkey -algorithm ed25519 -out "$AAC_MATERIAL_DIR/tenant-admin.pem"
openssl pkey -in "$AAC_MATERIAL_DIR/tenant-admin.pem" \
  -pubout -out "$AAC_MATERIAL_DIR/tenant-admin.pub.pem"

aac tenant register --profile "$AAC_PROFILE" \
  --display-name 'YOUR TEAM OR PROJECT' --contact 'YOUR EMAIL' \
  --tenant-admin-pubkey-file "$AAC_MATERIAL_DIR/tenant-admin.pub.pem" \
  --idp github --output table

aac sso login --profile "$AAC_PROFILE"
aac sso whoami --profile "$AAC_PROFILE" --output table
AAC_TENANT_ID=$(aac profile show "$AAC_PROFILE" --field tenant-id)
export AAC_TENANT_ID
aac tenant describe --profile "$AAC_PROFILE" --output table
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
AAC_TRUST_DOMAIN=$(aac tenant assign-hosted-domain --profile "$AAC_PROFILE" --field trust-domain)
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
place: **[Keys and certificates](https://docs.cascadeauth.com/overview/keys-and-certificates/)**. That page says
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

### Optional development integration fixture

The [manual PKI fixture](https://docs.cascadeauth.com/sidecar/integration/#generate-development-pki) is
only for the optional protocol example. Normal setup uses the CLI.

### Publish public trust material

For a file-backed demonstration, create a root-signing key and public half in
your private onboarding directory, then copy **only the public half** into the
publisher's root-key directory:

```bash
export AAC_ROOT_KEY_ID=demo-root-v1
test ! -e "$AAC_MATERIAL_DIR/${AAC_ROOT_KEY_ID}.pem"
openssl genpkey -algorithm ed25519 -out "$AAC_MATERIAL_DIR/${AAC_ROOT_KEY_ID}.pem"
openssl pkey -in "$AAC_MATERIAL_DIR/${AAC_ROOT_KEY_ID}.pem" \
  -pubout -out "$AAC_MATERIAL_DIR/${AAC_ROOT_KEY_ID}.pub.pem"
mkdir -p "$AAC_MATERIAL_DIR/root-public"
cp "$AAC_MATERIAL_DIR/${AAC_ROOT_KEY_ID}.pub.pem" "$AAC_MATERIAL_DIR/root-public/"

export AAC_TAP_TENANT_ID="$AAC_TENANT_ID"
export AAC_TAP_ADMIN_KEY_FILE="$AAC_MATERIAL_DIR/tenant-admin.pem"
export AAC_TAP_ROOT_KEYS_DIR="$AAC_MATERIAL_DIR/root-public"
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
export AAC_TAP_SPIFFE_BUNDLE_DIR="$AAC_MATERIAL_DIR/spiffe-ca-public"
# Populate this directory with your issuer's public <anchor_id>.ca.pem files.
export AAC_TAP_SPIFFE_TRUST_DOMAIN="$AAC_TRUST_DOMAIN"
export AAC_TAP_SPIFFE_BUNDLE_INGEST_URL=https://api.stage.cascadeauth.dev/v1/spiffe-bundle/ingest
tap_trust_url=https://trust.stage.cascadeauth.dev
export AAC_TAP_SPIFFE_BUNDLE_READ_URL="${tap_trust_url}/.well-known/spiffe-bundle/${AAC_TRUST_DOMAIN}"
aac-trust-anchor-publisher
```

For the optional integration reference's development PKI, set `AAC_TAP_SPIFFE_BUNDLE_DIR` to
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
