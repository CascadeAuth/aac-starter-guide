# AAC Sidecar

The AAC Sidecar is the runtime of Agent Authority Cloud (AAC). It runs beside
each AI agent, carries **delegated authority** from agent to agent as a signed
chain, verifies every incoming request locally against published trust
material, and signs the receipt when the work is done. Your agent keeps its
business logic and policy; the sidecar handles workload identity, proof of
possession, the authority chain and the evidence.

This image is the **public developer beta** of the sidecar: for evaluation and
integration development, not production or safety-critical use. Current
version **`v0.5.2`**, image `docker.io/cascadeauth/aac-sidecar:v0.5.2`. Use
versioned or digest references; there is no mutable `latest` tag.

## Where the sidecar sits in AAC

Authority in AAC is a signed chain that travels with the work, and the sidecar
is the component that writes and checks every link of it:

1. **A person or approved service identity authorizes work** in your
   application, which keeps its own policy. The originating agent's sidecar
   **mints the root** of the chain with the tenant's root signing key and
   appends the class of action.
2. **Each agent that passes the work on** asks its sidecar to **attenuate** the
   chain: a caveat that can only narrow what may be done, can only shorten the
   expiry, and names the next holder. The sidecar signs a proof of possession
   with the agent's workload identity.
3. **The receiving sidecar verifies locally**: the root signature against the
   originating tenant's published root key, the caveat chain, the presenter's
   proof of possession and identity, and the replay check. Nothing on the
   request path calls back to earlier agents or their identity providers, which
   is what keeps verification affordable as the network grows.
4. **The last agent's sidecar signs the receipt**, the evidence your tenant can
   check afterwards.

Two properties follow: authority never widens as it travels, and every chain
expires. The sidecar is where both are enforced, which is why it shares its
agent's loopback network environment and why verification refuses a request
when the valid trust material it needs is unavailable. The
[operations guide](https://docs.cascadeauth.com/sidecar/operations/) describes
how trust material is cached, refreshed and revoked.

The other components prepare what the sidecar needs and read what it produces:

| Public component | Where it runs | What it does |
|---|---|---|
| [AAC Sidecar](https://hub.docker.com/r/cascadeauth/aac-sidecar/) (this image) | Beside each agent, in the agent's network environment | Mints, attenuates and verifies authority; signs receipts |
| [AAC CLI](https://pypi.org/project/aac-cli/) (`aac`, `aeg`) | Your workstation or administration host | Registers tenants, generates the keys and the sidecar configuration, issues or validates the certificates |
| [Trust anchor publisher](https://pypi.org/project/aac-trust-anchor-publisher/) | In your tenant | Publishes the tenant's public root keys and CA certificates so other sidecars can verify it |
| [Control Plane](https://docs.cascadeauth.com/control-plane/) | AAC-hosted service | Tenant administration, identity, public-trust distribution, execution queries |
| [aac-invoke-auth](https://pypi.org/project/aac-invoke-auth/) | Inside your Python agent | Pairing authentication between the agent and its sidecar |
| [AEG](https://docs.cascadeauth.com/aeg/) | Your workstation, part of AAC CLI | Finds an execution and renders its authority, actions and receipt checks |

Read [what AAC is for](https://docs.cascadeauth.com/overview/) for the model
and its limits, and [keys and certificates](https://docs.cascadeauth.com/overview/keys-and-certificates/)
for what each component holds and for how long.

## Install the sidecar

**Container (default).** Pull the released image and confirm the executable:

```bash
docker pull docker.io/cascadeauth/aac-sidecar:v0.5.2
docker run --rm docker.io/cascadeauth/aac-sidecar:v0.5.2 -version
```

The sidecar and its agent must share one loopback network environment: the
same Kubernetes Pod, or a shared Docker network namespace. The
[container placement guide](https://docs.cascadeauth.com/sidecar/configuration/#advanced-installation-guide-container)
shows the mounts, identities and readiness check for your own environment.

**Standalone binary.** The `v0.5.2-bundle` tag in this repository carries the
same release as a signed bundle: binaries for `linux_amd64`, `linux_arm64`,
`darwin_amd64` and `darwin_arm64`, the configuration template, license and
documentation. The [download and install page](https://docs.cascadeauth.com/sidecar/install/)
covers pulling the bundle with ORAS, choosing the platform archive and placing
the executable; the optional
[release verification page](https://docs.cascadeauth.com/sidecar/reference/verification/)
checks signatures, checksums and build provenance first.

## Configure and connect it to your agent

1. Register the tenant and prepare the agent with the
   [AAC CLI](https://docs.cascadeauth.com/cli/guide/). The CLI generates the
   identities, credentials and the complete `sidecar-config.yaml`; nothing is
   edited by hand.
2. Run the [trust anchor publisher](https://docs.cascadeauth.com/trust-anchor-publisher/)
   for the tenant's public root keys and CA certificates.
3. Start the sidecar with `-config` pointing at the generated configuration,
   beside its agent, following
   [configure the sidecar](https://docs.cascadeauth.com/sidecar/configuration/).
4. Add pairing authentication to the agent and handle verified requests:
   [agent integration](https://docs.cascadeauth.com/sidecar/integration/) for
   the native request and response flow,
   [A2A integration](https://docs.cascadeauth.com/sidecar/a2a/) to receive and
   send A2A messages.

## Operate it

`GET /readyz` on the loopback listener reports the replay backend, effective
profile and replay-authority readiness; `GET /healthz` is liveness only. Readiness or
an HTTP 200 alone never proves an authorized call. The
[operations guide](https://docs.cascadeauth.com/sidecar/operations/) covers
startup, diagnostics, the error reference, auditing workflows, verifying
terminal evidence offline, credential renewal, upgrade and rollback.

Choose the replay profile for your deployment: **Basic** keeps replay state in
the sidecar's own memory, loses it on restart and does not coordinate replicas;
**Shared durable** uses the qualified authenticated-TLS Valkey deployment and
never falls back to Basic. See
[configuration and workflow state](https://docs.cascadeauth.com/sidecar/configuration/#configuration-and-workflow-state).
For one tenant with many agents, use the
[production journey](https://docs.cascadeauth.com/sidecar/configuration/#one-tenant-with-many-production-agents).

## Try the complete example

The fastest way to see the sidecar work is the Docker Compose example
**AAC: two tenants, one reservation made**: two developer tenants, two agents
with their sidecars and publishers, one authorized reservation, one signed
receipt. The example creates a reservation result; supplier integration and
payment are omitted for clarity. It is the same journey as
[Get started](https://docs.cascadeauth.com/get-started/).

Before you start, use macOS or Linux, Git, a Bash-compatible shell,
Python **3.11 or later** with `venv`/`pip`, and Docker with Compose and Buildx.
Allow outbound HTTPS for public packages and images, AAC stage and interactive
GitHub sign-in. Use real contact emails; the same person may own both tenants.
AAC assigns a hosted trust domain to each tenant; a tenant can instead
[use a DNS domain of his own](https://docs.cascadeauth.com/sidecar/configuration/#use-a-dns-domain-of-your-own-instead).

## 1. Install AAC CLI and prepare the example

```bash
python3 -m venv .aac-tools
. .aac-tools/bin/activate
python -m pip install --upgrade aac-cli
aac --version
aeg --version
```

Keep the environment active, then prepare the example:

```bash
git clone https://github.com/CascadeAuth/aac-compose-demo.git
cd aac-compose-demo
./demo prepare
mkdir -p .local
export AAC_CLI_HOME="$PWD/.local/aac"
cp config/trip-planner.yaml .local/trip-planner.yaml
cp config/booking.yaml .local/booking.yaml
```

Preparation selects the current released components and freezes their
versions and digests in `.local/components.json`; the two copied files are
the agents' editable inputs, and the environment variable gives the example
its own CLI home. Keep this shell, directory and variable.

## 2. Register and connect your tenants

Continue the [numbered developer journey](https://docs.cascadeauth.com/get-started/#2-register-your-developer-tenant-accounts):
register both tenants interactively and configure peer public trust. The CLI generates every credential and configuration file;
each publisher sends its tenant's public roots and CA certificates, and private
keys stay with their intended consumers.

## 3. Run and verify

```bash
./demo up
./demo run
```

Success includes `terminal_attestation_verification: verified`, the actual
task and root identifiers and the signed receipt. The private Docker network
publishes no host ports.

## 4. Inspect the execution graph and stop

Follow the journey's [list, select and render steps](https://docs.cascadeauth.com/get-started/#5-list-select-and-render-an-execution),
or run the complete `aeg render` command the run prints, and open the HTML
file locally. Then stop the containers while keeping credentials and evidence:

```bash
./demo down
```

## Releases, license and support

The [released-component record](https://docs.cascadeauth.com/released-components.json)
names the current sidecar, CLI, publisher and integration package versions;
[release notes](https://docs.cascadeauth.com/release-notes/) carry upgrade
guidance for each version, and the `v0.5.2-bundle` ships the starter guide,
the key map and the configuration template.

[AAC Sidecar Developer Beta Binary License 1.0](https://docs.cascadeauth.com/LICENSE)
and [third-party notices](https://docs.cascadeauth.com/THIRD_PARTY_NOTICES.md)
apply; no production SLA is implied. Python companions retain their own
licenses. Support: **support@cascadeauth.com**; licensing:
**legal@cascadeauth.com**. Send only versions, public digests and sanitized
errors, never private keys, API keys, session tokens or complete
secret-bearing configuration.
