Canonical: https://docs.cascadeauth.com/get-started/

Applies to: AAC Sidecar v0.4.4

Documentation revision: d9080525c18de9527631a4702a71536345a3b31b

---

# Run your first authenticated agent journey

Marc Sterling, a director at Austin-based private equity firm Vantis Equity,
needs to oversee an acquisition on-site in Shanghai. He uses Tourfedia's
corporate travel management platform to organize his trip from Austin (AUS)
to Shanghai (PVG).

Run **AAC: two tenants, one reservation made** from a fresh machine with the
public [Docker Compose demo](https://github.com/CascadeAuth/aac-compose-demo).
Vantis Equity's trip-planner delegates to Tourfedia's booking agent. You will
register both tenants, run their agents and sidecars, verify a signed receipt,
and inspect the execution graph.

The example application creates a reservation result; supplier integration and
payment are omitted for clarity. The approval is simulated. A 30-minute limit
bounds delegated authority, not a price hold.

## Before you start

Use macOS or Linux with a Bash-compatible shell, Git, Python **3.11 or later**
with `venv` and `pip`, and Docker with Compose and Buildx. Start the Docker
engine. Keep the machine's clock synchronized and its public CA store current.
Allow outbound HTTPS to GitHub, PyPI, Docker Hub, GHCR and the
[AAC stage endpoints](https://docs.cascadeauth.com/sidecar/configuration/#aac-stage-endpoints).
You need a browser for interactive GitHub sign-in and real contact email addresses.
The same human can own both tenants; a contact email does not select the sign-in account.

The steps below create the tenants and prepare credentials. AAC assigns the
trust domains; you do not need to own DNS, provision a CA or run Valkey for this
local example. Docker keeps each agent/sidecar pair's loopback private and
places the pairs on an isolated network without publishing host ports.

| Public component | How it is supplied |
|---|---|
| [AAC CLI](https://pypi.org/project/aac-cli/) | Install it in your host virtual environment; includes `aac` and `aeg`; `./demo prepare` freezes the run selection |
| [AAC sidecar](https://hub.docker.com/r/cascadeauth/aac-sidecar/) | Compose pulls the selected immutable image |
| [Trust anchor publisher](https://github.com/orgs/CascadeAuth/packages/container/package/aac-trust-anchor-publisher) / [Python package](https://pypi.org/project/aac-trust-anchor-publisher/) | Compose runs the publisher image for each tenant |
| [aac-invoke-auth](https://pypi.org/project/aac-invoke-auth/) | Supplied inside the example application image |
| [Python image](https://hub.docker.com/_/python), [Uvicorn](https://pypi.org/project/uvicorn/) and [HTTPX](https://pypi.org/project/httpx/) | Supplied inside the application image; host Python is also needed for CLI setup |

No minimum production sizing or fixed first-run duration is implied. Image and
package downloads, sign-in and local build speed affect elapsed time. Measure
registration-to-verified-result separately from cached start/run time.

## 1. Install AAC CLI and prepare the example

### Install AAC CLI

Install [aac-cli from PyPI](https://pypi.org/project/aac-cli/) in a virtual
environment. The package supplies both `aac` and `aeg`; its PyPI page also
contains installation and usage documentation.

```bash
python3 -m venv .aac-tools
. .aac-tools/bin/activate
python -m pip install --upgrade aac-cli
aac --version
aeg --version
```

### Prepare the Docker Compose example

Keep that virtual environment active, then download and prepare the example:

```bash
git clone https://github.com/CascadeAuth/aac-compose-demo.git
cd aac-compose-demo
./demo prepare
mkdir -p .local
export AAC_CLI_HOME="$PWD/.local/aac"
cp config/trip-planner.yaml .local/trip-planner.yaml
cp config/booking.yaml .local/booking.yaml
```

Keep this environment variable in each terminal used for the demo. It gives
the demo its own CLI home and leaves your other profiles alone.

These are **operator-authored inputs**, supplied explicitly with
`--agent-config`. The CLI alone generates keys, certificates, publisher
configuration, `compose.env` and `sidecar-config.yaml`. Never hand-edit those
generated outputs or consume the private `record.json` schema.

The inputs select Basic in-memory replay protection with `dev_mode: false`.
Development-issued certificates do not require development exceptions.
Each pair shares its own loopback interface; the sidecars communicate over a
private Docker network using HTTPS names `trip-planner` and `booking`.
No host ports are published.

`./demo prepare` resolves the current stable AAC package releases from PyPI and the
sidecar from the published release record, then resolves exact container digests.
It saves `.local/components.json` and installs the selected CLI in your active
virtual environment. Subsequent starts and maintenance reuse that file; they
never silently change a running demo. To start a new run with newer components,
stop the demo, retain the old receipt, and move the selection file aside before
running `./demo prepare` again. There is no mutable sidecar `latest` tag.

**Outcome:** the released CLI is installed, component versions/digests are frozen
for this run, and each agent has an editable input file. Keep using this shell.

## 2. Register your developer tenant accounts

Set your real contact addresses:

```bash
export VANTIS_CONTACT='you+vantis@example.com'
export TOURFEDIA_CONTACT='you+tourfedia@example.com'
aac init \
  --profile vantis \
  --agent trip-planner \
  --agent-config .local/trip-planner.yaml \
  --layout container \
  --admin-url https://api.stage.cascadeauth.dev \
  --data-plane-url https://api.stage.cascadeauth.dev \
  --trust-url https://trust.stage.cascadeauth.dev \
  --idp github \
  --display-name 'Vantis Equity Demo' \
  --contact "$VANTIS_CONTACT"
aac init \
  --profile tourfedia \
  --agent booking \
  --agent-config .local/booking.yaml \
  --layout container \
  --admin-url https://api.stage.cascadeauth.dev \
  --data-plane-url https://api.stage.cascadeauth.dev \
  --trust-url https://trust.stage.cascadeauth.dev \
  --idp github \
  --display-name 'Tourfedia Demo' \
  --contact "$TOURFEDIA_CONTACT"
```

Run interactively and acknowledge each permanent tenant registration. There
are two sign-ins per tenant: registration and administration. Use the same
GitHub account for both sign-ins of that tenant. A rerun reuses its registration;
it does not create another tenant. Noninteractive registration additionally
requires the explicit `--create-tenant` acknowledgement.

The assigned domains come from AAC; owning `tourfedia.com` is not a trust-domain
binding. Empty peer configuration is intentional during initial registration.

**Outcome:** two tenant IDs and AAC-assigned domains, registered workloads,
separate keys/certificates and generated container configuration. The CLI creates
development PKI for this example; it does not qualify these identities for
production. The agent runs application policy, its sidecar verifies/delegates
authority, and its tenant's publisher publishes public roots and CA certificates.

For enterprise registration, use the [CLI user guide](https://docs.cascadeauth.com/cli/)
and its enterprise IdP ceremony before preparing your own workloads.

## 3. Connect the two peers

Read the registered facts through supported CLI status output:

```bash
aac agent status --agent trip-planner --output json > .local/vantis-status.json
aac agent status --agent booking --output json > .local/tourfedia-status.json
VANTIS_TENANT=$(aac agent status --agent trip-planner --field tenant-id)
VANTIS_DOMAIN=$(aac agent status --agent trip-planner --field hosted-trust-domain)
VANTIS_ID=$(aac agent status --agent trip-planner --field workload-spiffe-id)
TOURFEDIA_TENANT=$(aac agent status --agent booking --field tenant-id)
TOURFEDIA_DOMAIN=$(aac agent status --agent booking --field hosted-trust-domain)
TOURFEDIA_ID=$(aac agent status --agent booking --field workload-spiffe-id)
```

Append these sections **once** to the input copies. The peer's public CA
path is an explicit trust choice; no private key is exchanged.
`ca.crt` is the peer's public CA certificate, the same anchor it publishes
through AAC. In a real deployment the peer supplies that public certificate;
reading it from the other agent's local directory is a convenience of running
both tenants on one machine, not a requirement to access a peer's private files.

```bash
cat >> .local/trip-planner.yaml <<EOF
trust_anchors:
  tenant_ids: [$TOURFEDIA_TENANT]
spiffe_bundles:
  trust_domains: [$TOURFEDIA_DOMAIN]
https_trust:
  ca_files: ["$AAC_CLI_HOME/agents/booking/agent/ca.crt"]
destinations:
  tourfedia:
    url: https://booking:9443/v1/agent/receive
    audience_pattern: $TOURFEDIA_ID
    valid_for: +30m
    timeout_ms: 10000
EOF
cat >> .local/booking.yaml <<EOF
trust_anchors:
  tenant_ids: [$VANTIS_TENANT]
spiffe_bundles:
  trust_domains: [$VANTIS_DOMAIN]
https_trust:
  ca_files: ["$AAC_CLI_HOME/agents/trip-planner/agent/ca.crt"]
EOF
aac init --profile vantis --agent trip-planner --agent-config .local/trip-planner.yaml
aac init --profile tourfedia --agent booking --agent-config .local/booking.yaml
```

These three trust settings have different jobs: verify tenant root signatures,
verify workload certificates, and verify outbound HTTPS connections.
The destination names the exact registered booking identity. The initial
class supplies `valid_for: +2h`; the destination supplies `+30m`.
Dynamic amounts come only from the application. Released native chain starts
refuse conflicting class/request values and any request-supplied
`valid_until`.

**Outcome:** each sidecar knows the other tenant's public trust and the planner
has an explicit booking destination. If interrupted, inspect your input copies:
do not append duplicate YAML sections. Rerun the final init commands to apply
the completed inputs while preserving the existing identities.

## 4. Run and verify the reservation

```bash
./demo up
./demo run
```

Startup builds the application image, starts the pairs and publishers, and
waits for readiness and public trust publication. The normal run reserves at
$8,000 under the simulated $10,000 approval. It waits up to 30 seconds for
correlated completion; missing evidence or failure exits nonzero.

**Success:** output includes the actual task/root IDs, reservation and signed
receipt, with `terminal_attestation_verification: verified`. An HTTP 200 or a
`dispatched` acknowledgement alone does not establish this result.

The demo also supplies [fare-change and fresh-authority exercises](https://github.com/CascadeAuth/aac-compose-demo#4-start-and-run)
and [refusal exercises](https://github.com/CascadeAuth/aac-compose-demo#5-refusals-and-controlled-attacks).
They start separate attempts; a new authorization does not widen an old chain.

## 5. List, select and render an execution

Each successful run saves its mint response under `.runs/`, prints the actual
evidence paths and a complete render command. For discovery, list both agents'
local files in the same shell:

```bash
PLANNER_STATE="$AAC_CLI_HOME/agents/trip-planner/state"
BOOKING_STATE="$AAC_CLI_HOME/agents/booking/state"
aeg list \
  --events "$PLANNER_STATE/telemetry.jsonl" \
  --events "$BOOKING_STATE/telemetry.jsonl" \
  --actions "$PLANNER_STATE/actions.jsonl" \
  --actions "$BOOKING_STATE/actions.jsonl" \
  --since 24h \
  --output table
```

Choose the root ID for the attempt you want. Replace `ROOT_ID` below with that
listed value, or use the complete command printed by the demo for its saved
mint response. Do not combine attempts just because they share an order number.

```bash
aeg render \
  --events "$PLANNER_STATE/telemetry.jsonl" \
  --events "$BOOKING_STATE/telemetry.jsonl" \
  --actions "$PLANNER_STATE/actions.jsonl" \
  --actions "$BOOKING_STATE/actions.jsonl" \
  --root-token-id ROOT_ID \
  --output .runs/selected.html
```

Open `.runs/selected.html` in a browser; it is self-contained and needs no web
server. Inspect nodes for identities, narrowing, actions and receipt evidence.
Add `--profile vantis` to list/render with authorized central metadata, or use
only that profile for central observations. Local files are never uploaded.
Missing partner evidence is labeled as partial; a business-action record is
not itself a verified receipt. See [Execution graphs](https://docs.cascadeauth.com/aeg/)
for source modes, filtering, pagination and interpretation.

## 6. Stop the example and keep your evidence

```bash
./demo down
```

This removes local containers/network while retaining `.local/` credentials,
the CLI home, component receipt and `.runs/` evidence. Tenant registrations
are permanent; deleting a local profile does not delete a tenant. Protect
retained keys and use the supported lifecycle commands to retire test workloads.
For later work, reactivate `.venv` and set the same `AAC_CLI_HOME`; follow the
demo's [refresh and renewal procedure](https://github.com/CascadeAuth/aac-compose-demo#6-refresh-renew-and-restart).

## Troubleshooting your first run

| Symptom | Next action |
|---|---|
| Docker or Compose unavailable | Start Docker and check `docker compose version` and `docker buildx version` |
| Registration/sign-in interrupted | Rerun the same init command with the same CLI home/profile; use the same account for both sign-ins of that tenant |
| Startup waits for trust | Check `aac agent status --agent trip-planner --remote` and `aac agent status --agent booking --remote`; confirm publishers are running and the expected public CA/root is visible |
| Peer TLS or identity refusal | Check the explicit peer public-CA paths, domain and workload ID in the input YAML; apply it again through init |
| Expired certificate | Follow the demo's renewal procedure; refresh peer public trust if the CA changed |
| No verified receipt or missing graph evidence | Keep the failed output and actual task/root IDs; inspect both agents' retained evidence. Do not count readiness or an empty graph as success |

See [operations and error codes](https://docs.cascadeauth.com/sidecar/operations/)
for focused diagnosis. Never resolve a refusal by disabling authentication,
identity validation or replay checks.

## What AAC is for

AAC carries delegated authority between agents with workload identity, local
verification and auditable receipts. Applications retain their business policy.
The [authority and integration reference](https://docs.cascadeauth.com/sidecar/integration/)
explains chains, receipts, predicates, pairing and the separate A2A example.

## Deploy beyond the example

The local example uses **Basic** replay with ordinary security checks enabled.
Basic retains duplicates within one running process, loses history on restart
and does not coordinate replicas of the same receiving identity. Use **Shared
durable** with the qualified authenticated-TLS Valkey deployment when you need
retained replay history or replica coordination; it never falls back to Basic.

Retained **A2A dispatch results** are a separate mechanism for safe retries
across restart. They are not the replay cache or ordinary audit logs. The native
reservation demo does not qualify production A2A storage or delivery guarantees.

For one tenant with many agents, use the [production journey and 100-agent role table](https://docs.cascadeauth.com/sidecar/configuration/#one-tenant-with-many-production-agents).
Tenant setup happens once; workloads, identities and pairing secrets belong to
each agent. Supplied-certificate setup uses your own issuer. Publisher ownership
is one root-set writer per tenant and one SPIFFE-bundle writer per active binding;
hosted and custom domains may use separate processes without competing writers.

## References

| Need | Public reference |
|---|---|
| Tenant and agent deployment, concrete ingress/PKI/storage requirements | [Deployment](https://docs.cascadeauth.com/sidecar/configuration/) |
| Keys, certificates, pairing secrets and custody | [Keys and certificates](https://docs.cascadeauth.com/overview/keys-and-certificates/) |
| CLI user journeys and generated command reference | [CLI documentation](https://docs.cascadeauth.com/cli/) |
| Protocol and optional A2A integration | [Integration](https://docs.cascadeauth.com/sidecar/integration/) |
| Diagnostics, audit, credential lifecycle and rollback | [Operations](https://docs.cascadeauth.com/sidecar/operations/) |
| Verify a container or audit artifacts — optional; standalone installation | [Artifacts](https://docs.cascadeauth.com/sidecar/install/) |

### Configuration and workflow state

The [configuration reference](https://docs.cascadeauth.com/sidecar/configuration/#configuration-and-workflow-state)
explains accepted settings and how authority, business payloads and retained
state differ. Use the CLI to apply changes to managed agent inputs.

## Beta boundary and contact

The sidecar is public developer-beta software under the
[AAC Sidecar Developer Beta Binary License 1.0](https://docs.cascadeauth.com/LICENSE).
Read the [third-party notices](https://docs.cascadeauth.com/THIRD_PARTY_NOTICES.md).
For support contact **support@cascadeauth.com**; license questions:
**legal@cascadeauth.com**. No production support/SLA is implied.
This beta is for evaluation and integration development, not production or
safety-critical use. Python companions retain their own licenses.
Current installation examples select AAC Sidecar **`v0.4.4`** from
`docker.io/cascadeauth/aac-sidecar:v0.4.4`; the [published component record](https://docs.cascadeauth.com/released-components.json) and
each run's selection retain exact version/digest provenance.

## Release notes

[Read release notes and upgrade guidance](https://docs.cascadeauth.com/release-notes/).
