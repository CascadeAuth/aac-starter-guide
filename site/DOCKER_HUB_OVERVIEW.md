# AAC Sidecar — public developer beta

Run **AAC: two tenants, one reservation made**: register two developer tenants,
start their agents and sidecars with Docker Compose, verify the reservation's
signed receipt, and inspect its execution graph.

The example application creates a reservation result; supplier integration and
payment are omitted for clarity. Its approval is simulated and the authority's
time limit is not a price hold.

## Before you start

Use macOS or Linux, Git, a Bash-compatible shell, Python **3.11 or later** with
`venv`/`pip`, and Docker with Compose and Buildx. Start Docker and allow outbound
HTTPS for public packages/images, AAC stage and interactive GitHub sign-in.
Use real contact emails; the same human may own both tenants. AAC assigns the
trust domains. The journey prepares credentials and configuration from scratch.

## 1. Install AAC CLI and prepare the example

Install [AAC CLI from PyPI](https://pypi.org/project/aac-cli/) first:

```bash
python3 -m venv .aac-tools
. .aac-tools/bin/activate
python -m pip install --upgrade aac-cli
aac --version
aeg --version
```

Keep the environment active, then prepare the Docker Compose example:

```bash
git clone https://github.com/CascadeAuth/aac-compose-demo.git
cd aac-compose-demo
./demo prepare
```

Preparation selects the current released CLI and freezes component
versions/digests in `.local/components.json`. Compose supplies the sidecars,
publishers and application dependencies. Keep this shell and directory.

## 2. Register and connect your tenants

Continue the [numbered developer journey](https://docs.cascadeauth.com/get-started/#1-install-aac-cli-and-prepare-the-example)
from `mkdir -p .local`: set the isolated CLI home, copy the two agent inputs,
register both tenants interactively and explicitly configure peer public trust.
The CLI generates the credentials and complete configuration. A publisher sends
public roots/CA certificates; private keys stay with their intended consumers.

## 3. Run and verify

After completing peer setup:

```bash
./demo up
./demo run
```

Success includes `terminal_attestation_verification: verified`, the actual
task/root IDs and signed receipt. Readiness or an HTTP 200 alone is insufficient.
The private Docker network publishes no host ports.

## 4. Inspect the graph and stop

Follow the journey's [list → select → render steps](https://docs.cascadeauth.com/get-started/#5-list-select-and-render-an-execution)
or execute the complete render command printed by the run. Open its HTML file
locally. Then stop the containers while preserving credentials and evidence:

```bash
./demo down
```

## Components and other deployments

| Public component | How it is supplied |
|---|---|
| [AAC CLI](https://pypi.org/project/aac-cli/) | Installed on the host by preparation; includes the graph tool |
| [AAC sidecar](https://hub.docker.com/r/cascadeauth/aac-sidecar/) | Immutable container image selected for the run |
| [Publisher container](https://github.com/orgs/CascadeAuth/packages/container/package/aac-trust-anchor-publisher) / [Python package](https://pypi.org/project/aac-trust-anchor-publisher/) | Compose runs the container for each tenant |
| [aac-invoke-auth](https://pypi.org/project/aac-invoke-auth/) | Supplied inside the application image |

Basic replay is process-local and lost on restart; it does not coordinate
replicas. Shared durable uses qualified authenticated-TLS Valkey. Retained A2A
dispatch results are separate from replay and audit logs. The
[deployment reference](https://docs.cascadeauth.com/sidecar/configuration/)
covers production identities, storage, restricted ingress and multi-agent setup.
Run one root-set writer per tenant and one SPIFFE-bundle writer per active
binding; adding a domain can require another publisher process with root
publishing disabled.

Use the [artifact reference](https://docs.cascadeauth.com/sidecar/install/)
for container or standalone installation. Optional
[signature and artifact checks](https://docs.cascadeauth.com/sidecar/reference/verification/)
have their own reference.
The [CLI guide/reference](https://docs.cascadeauth.com/cli/)
includes developer and enterprise registration. All
[references](https://docs.cascadeauth.com/sidecar/configuration/)
remain public.

## Stage and support

Current version: **`v0.5.2`**, image `docker.io/cascadeauth/aac-sidecar:v0.5.2`.
Use versioned/digest references; there is no mutable `latest` tag.
The [released-component record](https://docs.cascadeauth.com/released-components.json)
provides current installation metadata; each demo run retains its exact selection.

[AAC Sidecar Developer Beta Binary License 1.0](https://docs.cascadeauth.com/LICENSE)
and [third-party notices](https://docs.cascadeauth.com/THIRD_PARTY_NOTICES.md)
apply. No production SLA is implied. Support: **support@cascadeauth.com**;
licensing: **legal@cascadeauth.com**.
The public beta is for evaluation and integration development, not production
or safety-critical use. Python companions retain their own licenses. Send only
versions, public digests and sanitized errors to support, never private keys,
API keys, session tokens or complete secret-bearing configuration.

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
The [starter guide](https://docs.cascadeauth.com/get-started/) explains
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
