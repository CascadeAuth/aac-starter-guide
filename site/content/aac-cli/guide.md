# AAC CLI user guide

Use `aac` to register a tenant, sign in, prepare an agent's AAC files and
maintain identities and credentials. Use `aeg` to inspect execution evidence.
See the [AEG command reference](/aeg/reference/) for its syntax and options.
Install **aac-cli** to get both commands. The version label on this page names
the command snapshot; check `aac --version` before copying an example.

The [CLI documentation](/cli/) describes the latest
supported release at stable URLs. Upgrade your CLI to use the documented
commands. A documentation update does not change the commands installed on
your machine; historical release artifacts retain their original provenance.

- [Install and choose an environment](#install-and-choose-an-environment)
- [Register a tenant](#register-a-tenant)
- [Prepare and maintain an agent](#prepare-and-maintain-an-agent)
- [Supply your own certificates](#supply-your-own-certificates)
- [Profiles and scalar values](#profiles-and-scalar-values)
- [Manage credentials](#manage-credentials)
- [Domains and workloads](#domains-and-workloads)
- [Repair an identity-provider connection](#repair-an-identity-provider-connection)
- [One tenant with many production agents](#one-tenant-with-many-production-agents)
- [Find and inspect an execution](#find-and-inspect-an-execution)
- [Troubleshooting](#troubleshooting)
- [Complete command reference](/cli/reference/)

## Install and choose an environment

Get [aac-cli and its package documentation from PyPI](https://pypi.org/project/aac-cli/).
It installs both `aac` and `aeg`. For the other components, use the
[installation and operations hub](/), including the
[trust anchor publisher](/trust-anchor-publisher/) and [Control Plane](/control-plane/).

Use Python 3.11–3.14 and a Bash-compatible shell:

```bash
python3 -m venv .aac-tools
source .aac-tools/bin/activate
python -m pip install --upgrade aac-cli
aac --version
aeg --version
```

The examples use AAC **stage** for development. Obtain your deployment's
admin, data-plane and public trust URLs from AAC operations for another
environment. A profile selects endpoints and a tenant; it is not a sidecar
deployment. Credentials and agents live under `~/.aac` (the AAC CLI home).
Set `AAC_CLI_HOME` before setup to choose a different directory.

Examples use shell variables such as `$AAC_PROFILE` for values selected
earlier. Quoted `<UPPER_SNAKE_CASE>` placeholders mean values you must replace;
do not paste the angle brackets. Example email addresses, domains and labels
are illustrative. Commands in a later lifecycle section are deliberate
administrative actions, not a single script to run from top to bottom.

For Bash scripts, `set -euo pipefail` stops on failed commands, unset variables
and failed pipelines. This is shell error handling, not an AAC prerequisite.
Assign a command substitution first, then export it: an `export` on the same
line can hide a failed command's exit status.

```bash
set -euo pipefail
AAC_PROFILE=stage
export AAC_PROFILE
```

## Register a tenant

A tenant is one organisation. Register it once, then add its workloads.
Developer tenants use AAC's shared GitHub or Google connections; enterprise
tenants use their own Microsoft Entra ID connection. Registering a tenant is
permanent. Use a separate unbound profile for a new tenant.

### Developer setup with shared GitHub

Prefer `aac init`: it prepares tenant-admin material, registers your tenant,
signs you in, requests the assigned domain and registers one workload. Save
this minimal development configuration as `orders.yaml`:

```yaml
agent_name: orders
workload_path: orders
tls_server_names: [localhost, 127.0.0.1]
sidecar:
  agent_invoke_url: http://127.0.0.1:8000/invoke
classes_of_action: {}
destinations: {}
```

```bash
aac init --profile stage --agent orders --agent-config orders.yaml \
  --admin-url https://api.stage.cascadeauth.dev \
  --data-plane-url https://api.stage.cascadeauth.dev \
  --trust-url https://trust.stage.cascadeauth.dev \
  --display-name 'Example Team' --contact dev@example.com --idp github
```

The first sign-in registers the tenant; the second opens its administrator
session. Confirm the displayed registration plan. For a noninteractive script,
add `--create-tenant` to explicitly permit registration. Success returns the
tenant/workload identities and prepared paths; it does not start a sidecar.
Retry an interrupted setup with the same inputs. A conflicting profile or
agent identity is refused rather than overwritten.

### Developer setup with shared Google

For a separate new tenant, use a fresh profile and agent name, and a matching
configuration file. The registration command is the same except for
`--idp google`. Google uses browser PKCE with a local loopback callback;
GitHub normally uses device sign-in. For an existing tenant:

```bash
aac sso login --profile stage --idp github
aac sso login --profile google-team --idp google
aac sso whoami --profile stage --output table
aac sso logout --profile stage
```

Choose the connection used to register that tenant. `whoami` and `logout`
work locally. Sessions have no refresh token; sign in again after expiry.
AAC operates the shared connections; developers do not register their own
GitHub or Google OAuth application for these paths.

### Enterprise registration and Microsoft Entra ID

AAC operations registers an enterprise tenant during an onboarding ceremony.
Provide your organisation's name, contact and tenant-admin **public** key.
Operations supplies the approved endpoints and the allocated tenant ID.
The bootstrap token remains under the ceremony's custody; an ordinary tenant
administrator does not need it after onboarding. The optional manual route
below shows the ceremony command, not a requirement to run a private server.

Before the first connection, generate an offline recovery key. Retain its
private file offline and give operations only the enrollment document:

```bash
aac sso generate-idp-recovery-key \
  --private-key-file offline-idp-recovery.pem --enrollment-file recovery-enrollment.json
```

In Microsoft Entra ID, register a single-directory public-client application.
Record its **Application (client) ID**, the **Directory (tenant) ID** and the
Object ID of the security group containing your AAC administrators. Enable
public-client flows for device sign-in. Register the mobile/desktop loopback
redirect `http://127.0.0.1/callback` without a fixed port for PKCE, and include
security-group IDs in ID tokens. Save `connection.json`:

```json
{
  "issuer": "https://login.microsoftonline.com/<ENTRA_DIRECTORY_ID>/v2.0",
  "family": "entra",
  "expected_audience": "<ENTRA_APPLICATION_CLIENT_ID>",
  "binding_claims": {"tid": "<ENTRA_DIRECTORY_ID>"},
  "groups_claim": "groups",
  "role_map": {"<ENTRA_ADMIN_GROUP_OBJECT_ID>": ["tenant-admin"]}
}
```

Use the client ID GUID, not the application's display name. Use your exact
directory issuer, not `common`, `organizations` or `consumers`. Do not add
`jwks_static`: AAC performs OIDC discovery to obtain signing keys and flow
endpoints; static keys are a local test facility and do not enable interactive
login. `role_map` can map groups to `tenant-admin`, `key-admin`, `policy-admin`
or `auditor-read`. A token without a mapped group cannot obtain an AAC role.

Operations enrolls the compared public recovery key before registering the
first connection, using its protected ceremony environment:

```bash
aac sso enroll-idp-recovery-key --profile prod --tenant-id '<TENANT_ID>' \
  --file recovery-enrollment.json --bootstrap-token "$AAC_BOOTSTRAP_TOKEN"
aac sso register-idp --profile prod --tenant-id '<TENANT_ID>' \
  --file connection.json --bootstrap-token "$AAC_BOOTSTRAP_TOKEN"
```

For tenant use, create your profile and sign in to the allocated tenant.
Successful sign-in binds the profile and caches a session:

```bash
aac profile create prod --admin-url '<ADMIN_URL>' --data-plane-url '<DATA_PLANE_URL>'
aac sso login --profile prod --tenant-id '<TENANT_ID>' \
  --idp-url 'https://login.microsoftonline.com/<ENTRA_DIRECTORY_ID>/v2.0' --flow device
aac sso login --profile prod \
  --idp-url 'https://login.microsoftonline.com/<ENTRA_DIRECTORY_ID>/v2.0' --flow pkce --no-browser
aac sso whoami --profile prod --output table
aac tenant describe --profile prod --output table
```

`--no-browser` prints the PKCE URL; open it on the machine with the CLI's
loopback listener. Device flow permits the browser on another machine.
`aac sso list-idp --profile prod` shows safe connection handles even during a
login failure. Once a tenant-admin session works, omit the bootstrap token
when registering additional connections. GitHub/Google onboarding and both
Entra flows have dated stage acceptance from September 2026; that evidence
does not certify every directory's policies. Other provider recipes are not
claimed as field-validated here.

### Optional manual registration and key preparation

Use this when coordinating the enterprise ceremony or when you deliberately
need the lower-level registration command. Guided setup normally creates or
accepts the tenant-admin key for you. OpenSSL 1.1.1 or newer is required for
these Ed25519 commands. The subshell's `set -e` makes the existence guard stop
execution rather than overwrite a private key:

```bash
(
  set -e
  umask 077
  mkdir -p tenant-material
  test ! -e tenant-material/tenant-admin.pem
  openssl genpkey -algorithm ed25519 -out tenant-material/tenant-admin.pem
  openssl pkey -in tenant-material/tenant-admin.pem -pubout -out tenant-material/tenant-admin.pub.pem
) || exit 3
aac tenant register --profile prod --display-name 'Example Corporation' \
  --contact ops@example.com --tenant-admin-pubkey-file tenant-material/tenant-admin.pub.pem \
  --bootstrap-token "$AAC_BOOTSTRAP_TOKEN"
```

Self-service manual registration uses `--idp github` or `--idp google` instead
of the bootstrap token. AAC allocates the ID and saves the tenant API key;
protect the one-time registration output. Never submit a private PEM as the
public-key file. If a response is lost, retry identical registration inputs
so the saved request can resume. A bound profile cannot register a second
tenant. A saved-request mismatch requires restoring the original request
inputs; do not create a second tenant to work around an unknown outcome.

## Prepare and maintain an agent

After enterprise first-connection setup and sign-in, use the same `aac init`
path with `--profile prod`, the deployment's trust URL and your agent YAML;
omit the shared-provider `--idp` flag. Keep the active tenant-admin private key
available through the supported material flags. Configuration describes the
real workload path, listeners/TLS names, classes of action and recipients.
No class or self-destination is installed implicitly.

Each invocation selects one agent. A second workload needs its own agent name,
workload path and configuration. `~/.aac/agents/<name>/sidecar` contains
sidecar material; `agent` contains the pairing secret shared with that
application; `keep` contains renewal material. Tenant-admin/publisher material
is shared only inside that tenant's directory. Treat private files as secrets.

```bash
aac agent list --output table
aac agent status --agent orders --output table
aac init --profile stage --agent orders --layout container
aac init --profile stage --agent orders --agent-config orders.yaml
aac agent status --agent orders --remote --output table
aac agent renew --agent orders
aac agent renew --agent orders --ca
```

An unchanged `init` refresh recreates supported configuration/Compose outputs
without replacing keys. An explicit configuration file applies the new
settings after validation; identities cannot silently change. `status` reports
expiry, missing files, permissions and the next command; exit 3 means attention
is required. `--remote` additionally checks publication of this agent's root
key and CA; inspect those checks, not only local health. After leaf renewal,
restart consumers to load new files. CA renewal also requires publisher
republication and peer trust refresh; verify both communication directions.

### Supply your own certificates

Generated development CAs and one-day leaf certificates are for development.
For supplied PKI, your issuer must sign the workload/receipt SPIFFE identity
and the HTTPS names clients actually connect to. Supply the complete set:

```bash
aac init --profile prod --agent orders --agent-config orders.yaml \
  --trust-url '<TRUST_URL>' --tenant-admin-key-file tenant-material/tenant-admin.pem \
  --root-signing-key-file tenant-material/orders-root.pem \
  --ca-cert-file tenant-material/ca.pem \
  --workload-key-file tenant-material/workload.pem --workload-cert-file tenant-material/workload.crt \
  --terminal-key-file tenant-material/receipt.pem --terminal-cert-file tenant-material/receipt.crt \
  --tls-key-file tenant-material/https.pem --tls-cert-file tenant-material/https.crt
```

The CLI validates supplied files; it cannot renew certificates it did not sign.
Use `aac agent renew` with replacement key/certificate pairs from your issuer
(and `--ca-cert-file` when changing the CA). Supplied PKI alone does not
qualify a deployment for production: select durable replay protection, key
custody, ingress and storage appropriate to your service. See
[keys and certificates](/overview/keys-and-certificates/).

## Profiles and scalar values

```bash
aac profile list --output table
aac profile create test \
  --admin-url https://api.stage.cascadeauth.dev \
  --data-plane-url https://api.stage.cascadeauth.dev
aac profile show test
aac profile update test --admin-url https://api.stage.cascadeauth.dev
AAC_PROFILE=stage
export AAC_PROFILE
aac profile show
aac profile delete test
```

Selection is the command's `--profile`, then `AAC_PROFILE`, then `main`.
`profile show NAME` selects its positional name instead. Registration/login
binds a profile; you cannot edit `tenant_id` through `profile update`.
`show` distinguishes stored and effective settings, including environment
overrides, and never displays credentials. Deletion affects local profile
configuration, not the remote tenant; follow its pending-operation checks.

```bash
AAC_TENANT_ID=$(aac profile show "$AAC_PROFILE" --field tenant-id)
export AAC_TENANT_ID
AAC_TRUST_DOMAIN=$(aac tenant assign-hosted-domain --profile "$AAC_PROFILE" --field trust-domain)
export AAC_TRUST_DOMAIN
aac agent status --agent orders --field tenant-id
aac agent status --agent orders --field hosted-trust-domain
aac agent status --agent orders --field workload-spiffe-id
```

`profile show --field tenant-id` is read-only and returns the **effective**
tenant ID: `AAC_TENANT_ID` takes precedence over the stored profile value.
Unset that environment variable when you intend to inspect the stored binding.
`assign-hosted-domain` is an operation: it requests/reuses the allocation and
returns the validated server value, saving it only in the matching bound
profile. Use read-only `agent status` for already-prepared agent identities;
its profile check and local health requirements still apply. Do not read the
CLI's private record files. Each scalar is unquoted with one newline; invalid
selectors, unavailable values or unhealthy agents fail with empty stdout.
Do not combine `--field` with an explicit `--output`; agent fields are local
and cannot be combined with `--remote`.

## Manage credentials

Administrative commands require a tenant-admin session unless their reference
explicitly names another role or a ceremony. API keys authenticate data-plane
clients; they do not replace administrator sessions.

### Rotate a tenant API key without downtime

```bash
aac tenant api-key list --profile prod --output table
aac tenant api-key issue --profile prod
```

Issuance returns the new key ID and writes a separate protected staged key
file. Move every client to it, verify traffic, then retire the **old** key ID:

```bash
aac tenant api-key retire --profile prod --key-id '<OLD_API_KEY_ID>' --yes
```

The list reports lifecycle metadata, never key bytes. Do not retire a key
before its consumers move. `ERR_API_KEY_ROTATION_ALREADY_IN_PROGRESS` means
finish the existing rotation; `ERR_API_KEY_LAST_ACTIVE` refuses removal of
the last active key. After loss or suspected compromise, this command revokes
all active keys and issues one replacement, so plan a coordinated restart:

```bash
aac tenant reissue-api-key --profile prod
```

### Rotate the tenant-admin key

Prepare a fresh Ed25519 key pair under your normal custody. Stop publishers,
register the new public half, install the private half at their configured
location and recreate/restart them. Confirm accepted uploads before resuming:

```bash
aac tenant rotate-admin-key --profile prod --tenant-admin-pubkey-file '<NEW_ADMIN_PUBLIC_KEY_FILE>'
```

The old key stops verifying immediately and cannot be reinstated
(`ERR_ADMIN_KEY_PREVIOUSLY_RETIRED`). The publisher reads its key at start;
restarting a container with an old mount/environment still uses the old key.

## Domains and workloads

An AAC-assigned hosted trust domain needs no DNS proof. Use its returned
name rather than assembling a suffix yourself. For a domain you control,
prove the exact DNS name, then bind it as a SPIFFE trust domain:

```bash
aac tenant issue-domain-challenge --profile prod --domain example.com
# Publish the returned TXT record in DNS, then:
aac tenant verify-domain --profile prod --domain example.com
aac tenant describe --profile prod --output table
aac tenant bind-trust-domain --profile prod --trust-domain example.com
aac tenant list-trust-domains --profile prod --output table
aac tenant add-workload --profile prod --spiffe-id spiffe://example.com/orders --display-name Orders
aac tenant list-workloads --profile prod --output table
aac tenant describe-workload --profile prod --workload-id '<WORKLOAD_ID>'
aac tenant update-workload --profile prod --workload-id '<WORKLOAD_ID>' --display-name 'Order service'
```

Responses supply claim/binding/workload IDs for later operations. A business
domain proof and a SPIFFE binding are separate records. A domain held by
another tenant requires the platform transfer procedure. Teardown is
deliberate; deactivated workload identities remain reserved:

```bash
aac tenant deactivate-workload --profile prod --workload-id '<WORKLOAD_ID>' --reason 'Service retired'
aac tenant revoke-trust-domain --profile prod --binding-id '<BINDING_ID>' --reason 'Service retired'
aac tenant release-domain --profile prod --domain example.com --reason 'No longer used'
aac tenant revoke-domain --profile prod --domain example.com --reason 'Compromised'
aac tenant reactivate-hosted-domain --profile prod
```

Release and revoke are alternative business-domain lifecycle actions, not a
sequence to apply blindly. Hosted reactivation reuses the permanent name
and is allowed only under the server's self-service/ceremony policy.

## Repair an identity-provider connection

While sign-in works, list the connection and submit a complete replacement
file with the exact observed revision; concurrent edits fail safely:

```bash
aac sso list-idp --profile prod --output table
aac sso replace-idp \
  --profile prod \
  --connection-id '<CONNECTION_ID>' \
  --revision '<REVISION>' \
  --file connection.json
aac sso list-idp-recovery-keys --profile prod --output table
```

When the only IdP is unavailable, tenant operations signs a scoped repair with
its offline key; AAC operations independently compares the request ID and
fingerprint through the incident channel and approves that exact request:

```bash
aac sso request-idp-repair --profile prod --connection-id '<CONNECTION_ID>' \
  --revision '<REVISION>' --file connection.json --recovery-key-file offline-idp-recovery.pem
# AAC operations runs the second-party approval:
aac sso approve-idp-repair --profile prod --tenant-id '<TENANT_ID>' \
  --connection-id '<CONNECTION_ID>' --repair-request-id '<REPAIR_REQUEST_ID>' \
  --repair-intent-fingerprint '<REPAIR_INTENT_FINGERPRINT>' --bootstrap-token "$AAC_BOOTSTRAP_TOKEN"
```

After approval, tenant operations redeems it for the exact replacement:

```bash
aac sso replace-idp --profile prod --connection-id '<CONNECTION_ID>' \
  --revision '<REVISION>' --file connection.json --repair-request-id '<REPAIR_REQUEST_ID>' \
  --recovery-key-file offline-idp-recovery.pem
```

The repair grants no general administration or login authority. After replacement,
sign in normally and verify the descriptor. Keep recovery material separate
from tenant-admin/publisher keys. To replace or deliberately revoke it:

```bash
aac sso generate-idp-recovery-key --private-key-file next-recovery.pem --enrollment-file next-enrollment.json
aac sso rotate-idp-recovery-key \
  --profile prod \
  --file next-enrollment.json \
  --replaces-recovery-key-id '<RECOVERY_KEY_ID>'
aac sso revoke-idp-recovery-key --profile prod --recovery-key-id '<RECOVERY_KEY_ID>' --reason 'Retired'
```

Rotation needs a working tenant-admin session. Compare the currently active
key ID before changing it; a stale lifecycle precondition fails. Revocation
removes that recovery route until another verifier is enrolled.

## One tenant with many production agents

Set up the tenant once: register it, establish the enterprise IdP and recovery
path, protect the tenant-admin key and run a publisher for the tenant's CA
and its originators' root public keys. Register each workload, issue its
identity certificate from the tenant's issuer and deploy one sidecar beside
each application. Use unique application/sidecar pairing secrets per pair.

For a chain of 100 agents where each calls the next, register their identities:

```bash
for n in {1..100}; do
  aac tenant add-workload --profile prod --spiffe-id "spiffe://example.com/agent-$n" --display-name "Agent $n"
done
```

The tenant issuer issues each SPIFFE identity; the CLI does not become your
production CA. Agent 1, if it starts the task, needs the root signing key and
a configured initial class of action. Agents 1–99 need explicit destinations
for their successors; forwarding narrows inherited authority and signs with
the workload identity key. Agent 100 needs a receipt-signing key if it
finishes the task. All need the applicable trust URLs, tenant API key,
runtime storage/replay configuration and their own pairing secret. Publish
only public CA/root material; distribute private material only to its consumer.

Use the [configuration reference](/sidecar/configuration/#configuration-and-workflow-state)
for accepted fields and the [key inventory](/overview/keys-and-certificates/)
for custody and certificate lifetimes. Configure actual peers, not invented
self-calls. `aac init` can prepare its supported supplied-material layout;
role-specific minimal deployments can use the optional manual route. A
100-workload registration example is not a throughput or deployment qualification.

## Find and inspect an execution

```bash
aac trust-anchor list --profile prod --output table
aac trust-anchor describe --profile prod --kid '<ROOT_KEY_ID>'
aac chain list --profile prod --since 7d --limit 50 --output json
aac chain show --profile prod --token-id '<ROOT_TOKEN_ID>' --output table
aeg list --events planner-events.jsonl --actions planner-actions.jsonl --since 24h
aeg list --profile prod --since 7d --output table
aeg list --profile prod --events planner-events.jsonl --actions planner-actions.jsonl --since 7d
aeg render --profile prod --root-token-id '<ROOT_TOKEN_ID>' --output execution.html
```

The central API shows participant-visible observations, not business payloads.
`chain list` fetches one page. Reuse its resolved `from`/`to` interval and
`next_page_token` to continue; cursors expire after 15 minutes. Relative windows
are resolved once per listing. `aeg list --max-pages` bounds multi-page fetches
and reports continuation/partial coverage. Local mode reads files; a profile
selects control-plane mode; both select hybrid mode. `sources=local` does not
prove AAC never ingested that root. Actions without token-to-root evidence
remain unresolved. A local task-reference filter cannot select central-only
rows. Late arrivals can change live pages; repeat the original interval to
refresh. Render the selected `root_token_id`, optionally adding local files.
See the [graph guide](/aeg/) for saved traces, partial evidence,
conflicts, application records and exit code 4 on central fetch failure.

Run the [two-tenant reservation demo](https://github.com/CascadeAuth/aac-compose-demo)
for a complete setup → peer configuration → verified receipt workflow with
the current published components. The application omits supplier integration
and payment; it does not guarantee a price hold.

## Troubleshooting

| Result | Meaning and next step |
|---|---|
| Exit 2 | Invalid flag/value/combination. Check this version's reference. |
| Exit 3 | Local profile, credential or agent state needs attention; follow stderr. No scalar value is emitted. |
| Exit 4 | Endpoint unreachable. Check the selected endpoints and connectivity; do not blindly replay mutations. |
| `ERR_SESSION_TOKEN_MISSING`, expired session | Sign in to the intended tenant again. |
| `ERR_SESSION_TENANT_MISMATCH`, `ERR_SESSION_ROLE_FORBIDDEN` | Check profile, tenant and group-to-role mapping; an API key is not an admin session. |
| `ERR_IDP_ALREADY_BOUND` | Registration is create-only; inspect and replace the connection with its current revision. |
| `ERR_TRACE_NOT_FOUND` | Check the root/token ID and participant visibility; missing telemetry is not proof no execution occurred. |
| `AADSTS700016` | Entra audience must be the Application (client) ID GUID. |
| `AADSTS50011` | Register the exact loopback callback path for PKCE. |
| No login flow endpoints | A static test connection cannot perform browser/device login; use discovery for the enterprise connection. |

Remote rejections use exit 1 and preserve the server's stable code on stderr.
Rate limits include the wait interval; retry deliberately. Retain sanitized
command/version/error details when contacting support@cascadeauth.com; omit
API keys, tokens, private PEMs and raw business payloads.
