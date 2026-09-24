# AAC Sidecar — public developer beta

AAC Sidecar is the compiled Go process that runs beside your agent and verifies
delegated authority before delivering work to it. This repository provides
the **sidecar image** and an alternative **standalone-binary bundle** for
installation on a VM or macOS.

Current version: **`v0.4.3`**. Linux containers support AMD64 and ARM64;
the bundle also contains Linux/macOS standalone binaries for both architectures.
Artifacts are immutable. There is no `latest` tag.

Read the [full developer guide and runnable examples](https://cascadeauth.github.io/aac-starter-guide/)
in your browser, or [download the configuration template](https://cascadeauth.github.io/aac-starter-guide/sidecar-config.template.yaml).
No ORAS installation or standalone-binary download is needed to use these docs.

Run the [AAC: two tenants, one reservation made](https://github.com/CascadeAuth/aac-compose-demo)
to follow native delegation from Vantis Equity to Tourfedia and verify a signed
receipt for a reservation. The example application creates a reservation result;
supplier integration and payment are omitted for clarity. It does not promise
a supplier booking or price hold. Its README includes the intended refusals and
certificate-maintenance checks.

## Before you start

**First setup:** budget about an hour of hands-on work. AAC assigns your trust
domain, so there is no DNS record to publish and no propagation wait.
You need a GitHub or Google account and Python 3.10 or later for the AAC CLI
(the commands use the tested Python 3.12 environment). [Register your developer tenant](https://cascadeauth.github.io/aac-starter-guide/#register-your-developer-tenant)
and follow the guide's development PKI recipe if you do not already have an
issuer. The optional Python example also uses OpenSSL 3.x and its documented
application libraries.

**Quick container setup:** have Docker, a running paired agent, tenant
configuration/credentials and writable state ready. Cosign/Buildx verification
and the ORAS bundle are optional advanced paths. Deployments beyond the local
example need managed PKI, an explicit replay profile and qualified retained A2A storage.

## Quick installation and run guide

**About 5–10 minutes with Docker, your tenant configuration and a paired agent
ready.** This path uses the versioned image directly. For image verification,
Kubernetes or standalone binaries, see the Advanced installation guide below.

### 1. Pull the sidecar

```bash
docker pull cascadeauth/aac-sidecar:v0.4.3
```

### 2. Configure your tenant and agent

Use your onboarding configuration as `sidecar-config.yaml`. Check these values
before starting (paths inside the container begin with `/etc/aac`):

| Setting | Your value |
|---|---|
| `tenant.id`, `agent.spiffe_id` | Your tenant ID and registered workload identity |
| `sidecar.agent_invoke_url` | `http://127.0.0.1:8000/invoke` for an agent listening on port 8000 |
| `sidecar.agent_invoke_auth.secret_file` | The pairing-secret file; your agent reads the same secret bytes |
| Credential, trust and replay settings | Use your provisioned TLS/identity files, published trust and selected replay profile |

Keep the config and its referenced files in one prepared directory, and a
separate writable directory for retained state. The image runs as `65532:65532`;
that user must be able to read the config/keys and write the state directory.
Keep private files restricted. Set these three values to your **actual running
agent container** and **absolute directory paths**:

```bash
export AAC_AGENT_CONTAINER='your-running-agent-container'
export AAC_CONFIG_DIR='/absolute/path/to/prepared/aac-config'
export AAC_STATE_DIR='/absolute/path/to/prepared/aac-state'
```

Need to prepare a configuration from scratch? “Configuration details and full
starter guide” below explains the inputs and how to obtain the template.
[Register your developer tenant](https://cascadeauth.github.io/aac-starter-guide/#register-your-developer-tenant)
through the CLI; contact **support@cascadeauth.com** if that process fails.

### 3. Start the sidecar

```bash
docker run --detach --name aac-sidecar \
  --network "container:${AAC_AGENT_CONTAINER}" \
  --read-only --cap-drop ALL --security-opt no-new-privileges \
  --mount "type=bind,src=${AAC_CONFIG_DIR},dst=/etc/aac,readonly" \
  --mount "type=bind,src=${AAC_STATE_DIR},dst=/var/lib/aac" \
  cascadeauth/aac-sidecar:v0.4.3 \
  -config /etc/aac/sidecar-config.yaml

docker logs --tail 50 aac-sidecar
docker exec aac-sidecar /aac-sidecar -version
```

The version command prints `aac-sidecar v0.4.3`. If your agent image
includes `curl`, check health and readiness from that container:

```bash
docker exec "${AAC_AGENT_CONTAINER}" curl --fail --silent --show-error http://127.0.0.1:8080/healthz
docker exec "${AAC_AGENT_CONTAINER}" curl --fail --silent --show-error http://127.0.0.1:8080/readyz
```

These probes run in the agent container's shared network namespace; the
sidecar image contains neither a shell nor `curl`. Without `curl`, use your
agent's HTTP client to GET the same two URLs there. Then send an authenticated
test through your agent. Readiness reports the replay profile and component health; the test confirms your trust and
agent configuration. Keep port 8080 private; expose only the approved external
HTTPS path on 9443. The commands above do not publish any host ports.

For peer access, publish 9443 when creating the **agent** container, for example
`-p <approved-ingress-IP>:9443:9443`. The sidecar joins that network namespace
and cannot publish a separate set of ports. Restrict ingress to the intended
receive/A2A paths; mint/delegation routes belong only to your authenticated
originator application. Keep port 8080 private.

## Advanced installation guide

Use this section for signature/digest verification, detailed configuration,
Kubernetes deployment or a standalone binary. It installs the same sidecar as
the quick guide.

### Verify and pull the sidecar image

With Docker (including Buildx) and Cosign 3.1.3 installed, copy this block into
a Bash-compatible shell. It verifies, pulls and runs the **sidecar's** version
command; it does not require a tenant or any keys:

```bash
set -euo pipefail
export AAC_SIDECAR_VERSION=v0.4.3
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
docker run --rm --network none \
  "${AAC_SIDECAR_IMAGE}@${AAC_SIDECAR_DIGEST}" -version
```

The final command prints `aac-sidecar v0.4.3` and its build identity.
Docker selects the image matching your Linux architecture. The image contains
the `/aac-sidecar` entrypoint and runs as user/group `65532:65532`.

### Configuration details and full starter guide

Installing the image is complete after the pull. Starting an authenticated agent
workflow also requires your onboarding and deployment inputs:

| Input | Where it is used |
|---|---|
| Tenant ID, workload SPIFFE identity and published public trust | Sidecar configuration and trust verification |
| Workload SVID/key and any required root/terminal signing material | Sidecar only; never give these private keys to the agent |
| One pairing secret | The sidecar and its paired agent read the same secret bytes |
| TLS certificate/key and outbound CA roots | Sidecar external HTTPS and outbound connections |
| Replay authority and retained A2A state | Basic replay is process-local and lost on restart; Shared durable requires qualified authenticated-TLS Valkey. Retained A2A state has separate qualified storage |
| Your agent application | Runs beside the sidecar; implements the documented authenticated handler |

Download the [configuration template](https://cascadeauth.github.io/aac-starter-guide/sidecar-config.template.yaml)
and follow the [full starter guide](https://cascadeauth.github.io/aac-starter-guide/).
Fill the template with your own inputs. The image does not
contain sample credentials or automatically create a tenant. Keep the config
and private key files restricted and readable by the sidecar's non-root user;
make the state directory writable by that user.

The sidecar and agent share a network namespace. A Kubernetes Pod naturally
provides this; the signed starter guide includes a Pod example. With plain
Docker, after starting your configured agent, set these three shell variables
to your actual container name and absolute prepared directories:

```bash
export AAC_AGENT_CONTAINER='your-running-agent-container'
export AAC_CONFIG_DIR='/absolute/path/to/prepared/aac-config'
export AAC_STATE_DIR='/absolute/path/to/prepared/aac-state'
```

Then run the sidecar using the verified image from the advanced pull:

```bash
set -euo pipefail
test -f "${AAC_CONFIG_DIR}/sidecar-config.yaml"
test -d "${AAC_STATE_DIR}"
docker run --detach --name aac-sidecar \
  --network "container:${AAC_AGENT_CONTAINER}" \
  --read-only --cap-drop ALL --security-opt no-new-privileges \
  --mount "type=bind,src=${AAC_CONFIG_DIR},dst=/etc/aac,readonly" \
  --mount "type=bind,src=${AAC_STATE_DIR},dst=/var/lib/aac" \
  "${AAC_SIDECAR_IMAGE}@${AAC_SIDECAR_DIGEST}" \
  -config /etc/aac/sidecar-config.yaml

docker logs --tail 50 aac-sidecar
docker exec aac-sidecar /aac-sidecar -version
```

The agent normally listens on `127.0.0.1:8000`, the sidecar loopback API on
`127.0.0.1:8080`, and external HTTPS on 9443. Check `/healthz` and `/readyz`
from the shared network namespace. `/readyz` reports replay backend, profile and component readiness;
also verify public trust and an authenticated workflow. Never expose the
loopback API. Expose only the approved external HTTPS path. An ordinary Compose
bridge does not share the two containers' loopback interfaces.

### Get the signed guide, template or standalone binary

This path needs ORAS 1.3.3 and Cosign 3.1.3. It downloads
the signed bundle, verifies the checksums, and extracts the archive for your
machine. Container users can instead read the
[full guide](https://cascadeauth.github.io/aac-starter-guide/) and
[download the template](https://cascadeauth.github.io/aac-starter-guide/sidecar-config.template.yaml)
in a browser. Use this ORAS path for verified offline copies, deeper audit or
standalone installation.

```bash
set -euo pipefail
export AAC_SIDECAR_VERSION=v0.4.3
export AAC_BUNDLE_REF="docker.io/cascadeauth/aac-sidecar:${AAC_SIDECAR_VERSION}-bundle"
export AAC_BUNDLE_DIGEST="$(oras resolve "${AAC_BUNDLE_REF}")"
[[ "${AAC_BUNDLE_DIGEST}" =~ ^sha256:[0-9a-f]{64}$ ]]

cosign verify \
  --certificate-identity 'https://github.com/CascadeAuth/aac-sidecar-go/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  "docker.io/cascadeauth/aac-sidecar@${AAC_BUNDLE_DIGEST}"

mkdir -p "${HOME}/aac-downloads/${AAC_SIDECAR_VERSION}"
cd "${HOME}/aac-downloads/${AAC_SIDECAR_VERSION}"
oras pull "docker.io/cascadeauth/aac-sidecar@${AAC_BUNDLE_DIGEST}"
cosign verify-blob \
  --certificate-identity 'https://github.com/CascadeAuth/aac-sidecar-go/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle checksums.txt.bundle checksums.txt
bash verify-developer-beta.sh . "${AAC_SIDECAR_VERSION}"

case "$(uname -s)-$(uname -m)" in
  Linux-x86_64) AAC_PLATFORM=linux_amd64 ;;
  Linux-aarch64|Linux-arm64) AAC_PLATFORM=linux_arm64 ;;
  Darwin-x86_64) AAC_PLATFORM=darwin_amd64 ;;
  Darwin-arm64) AAC_PLATFORM=darwin_arm64 ;;
  *) echo 'Unsupported platform'; exit 1 ;;
esac
mkdir -p extracted
tar -xzf "aac-sidecar_${AAC_SIDECAR_VERSION}_${AAC_PLATFORM}.tar.gz" -C extracted
./extracted/aac-sidecar -version
```

Open `extracted/DEVELOPER_BETA_STARTER_GUIDE.md` and
`extracted/sidecar-config.template.yaml`. For a new user-owned standalone install
with no existing sidecar at these paths:

```bash
set -euo pipefail
export AAC_INSTALL_ROOT="${HOME}/.local/lib/aac-sidecar/releases/${AAC_SIDECAR_VERSION}"
test ! -e "${AAC_INSTALL_ROOT}"
test ! -e "${HOME}/.local/bin/aac-sidecar"
mkdir -p "${AAC_INSTALL_ROOT}" "${HOME}/.local/bin"
cp -R extracted/. "${AAC_INSTALL_ROOT}/"
ln -s "${AAC_INSTALL_ROOT}/aac-sidecar" "${HOME}/.local/bin/aac-sidecar"
"${HOME}/.local/bin/aac-sidecar" -version
```

After preparing your configuration, start it with
`~/.local/bin/aac-sidecar -config /absolute/path/to/sidecar-config.yaml`.
Follow the signed guide for an existing installation, process supervision,
state retention and removal.

## Companion tools

These are separate artifacts with distinct jobs. **The publisher image is not
the sidecar image.** You do not need every companion on every agent host.

Install the current release of each from PyPI; these packages version
independently of the sidecar and of each other.

| Tool | Purpose and installation location |
|---|---|
| [`aac-cli`](https://pypi.org/project/aac-cli/) | On the operator/developer machine: onboarding, profiles, credentials and trace inspection |
| [`aac-trust-anchor-publisher`](https://pypi.org/project/aac-trust-anchor-publisher/) | In the tenant's trust-publishing environment: signs uploads of public root keys/SPIFFE CA material; one writer for the tenant's root keys and one per active domain binding |
| [`aac-invoke-auth`](https://pypi.org/project/aac-invoke-auth/) | In the Python paired application's environment: verifies sidecar pairing signatures; other languages implement the same contract |

Install the CLI and wheel-based publisher in an isolated operator environment:

```bash
python3.12 -m venv .aac-tools
. .aac-tools/bin/activate
python -m pip install aac-cli aac-trust-anchor-publisher
aac --version
aac-trust-anchor-publisher --help
```

For the guide's Python/FastAPI agent, install
`python -m pip install 'aac-invoke-auth[fastapi]'` in that application's
environment. Its application server is separate from the sidecar. The signed
guide explains the sample and pairing configuration.

If you deploy the **publisher as a container instead of a Python wheel**, pull
its separate, immutable AMD64/ARM64 image. Unlike the wheel installs above, a
container pull is pinned **by digest** — the digest is what makes it verifiable,
so this one example names an exact version on purpose and does not track the
newest release. The index below is publisher **0.2.2**; Docker selects the
matching platform, and the readable tag for it is
`ghcr.io/cascadeauth/aac-trust-anchor-publisher:0.2.2`. Both stay on 0.2.2 when
newer releases appear. To move deliberately, take the version and its digest
together from the
[publisher's GHCR package page](https://github.com/orgs/CascadeAuth/packages/container/package/aac-trust-anchor-publisher):

```bash
docker pull ghcr.io/cascadeauth/aac-trust-anchor-publisher@sha256:e2f436282531677f21189bc201de66bfb9f1fe12ba7aabae5a47700aa13aeb14
```

Configure it using the [publisher's guide on PyPI](https://pypi.org/project/aac-trust-anchor-publisher/).
With separate ingest and trust hosts, supply the full
`AAC_TAP_SPIFFE_BUNDLE_READ_URL`; for AAC stage it is
`https://trust.stage.cascadeauth.dev/.well-known/spiffe-bundle/<your-trust-domain>`.
Signed ingest uses the supplied API host. Keep private keys in their documented
tenant-controlled locations and publish only public trust material.

## Stage and support

AAC stage uses `https://api.stage.cascadeauth.dev` for CLI/admin/data-plane
requests and `https://trust.stage.cascadeauth.dev` for public trust documents.
These are stage endpoints. Use the onboarding packet for your tenant and
deployment; downloading a binary does not grant an identity or access.

The Go sidecar is distributed under its included AAC Sidecar Developer Beta
Binary License 1.0. Python companions retain their own licenses, including
Apache 2.0 for the publisher. Contact **support@cascadeauth.com** for onboarding
or an installation issue. Include versions, public digests, sanitized errors
and the failed step; never send private keys, API keys, session tokens or
complete secret-bearing configuration.

## Release notes

**Upgrade to v0.4.0:** native chain starts (`/v1/agent/delegations` and
`/v1/agent/mint-root`) now require the existing pair's AAC1 signature. Update
actual originators to sign the exact alias/raw body before upgrading. Optional
application obligations supply T1 limits with strict conflict refusal; native
request expiry is refused in favor of class `valid_for`. HMAC freshness is not
idempotent minting. See the guide's native authority and pairing sections.

Native forwarding refuses widened candidates before outgoing proof signing or
send. Remove caller `valid_until` from native forwarding `additional_predicates`
and use destination `valid_for`; inherited/root expiry bounds still apply.
The [starter guide](https://cascadeauth.github.io/aac-starter-guide/) explains
asynchronous refusal outcomes and the unchanged A2A expiry behavior.

**Upgrade to v0.4.1:** remove any `state_store.cold` block; durable arrival storage
is unavailable. Remove configured class/destination `predicates.valid_until` and
use `valid_for`. A destination without `timeout_ms` now inherits the global
`timeouts.cross_org_dispatch_timeout_seconds` budget (5 seconds by default).
Explicit signed `task_ref` values must match workflow correlation; conflicts
refuse the whole native decision before any branch signs or sends. See the
starter guide's configuration and workflow-state sections for migration details.
With A2A enabled and a deadline below 5 seconds, an omitted destination timeout
cannot use the new 5-second default: set `timeout_ms` within the A2A deadline
or lower the global dispatch budget. CLI-generated configurations are unaffected.

**v0.4.2:** documents the native two-tenant reservation demo and links its public
setup, receipt/refusal and certificate-lifecycle exercises. This release carries
the updated guide and overview; runtime authorization, configuration and wire
behavior are unchanged from v0.4.1. Existing v0.4.1 artifacts remain available unchanged.

**v0.4.3:** distribution update; the runnable image is published after its matching
signed bundle. Runtime behavior and configuration remain the same as v0.4.2.
