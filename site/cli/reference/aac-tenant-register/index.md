Canonical: https://docs.cascadeauth.com/cli/reference/aac-tenant-register/

Applies to: AAC CLI 0.2.11

Documentation revision: a4b073409b4b2f23d4b22c518a5adfa1d6bd895e

---

# `aac tenant register`

Register a tenant or resume this profile's pending registration.

## Synopsis

```text
aac tenant register
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--display-name DISPLAY_NAME]
  [--contact CONTACT]
  [--tenant-domain TENANT_DOMAIN ...]
  [--workload-spiffe-id WORKLOAD_SPIFFE_ID ...]
  [--parent-tenant-id PARENT_TENANT_ID]
  [--tenant-admin-pubkey-file TENANT_ADMIN_PUBKEY_FILE]
  [--spiffe-trust-domain SPIFFE_TRUST_DOMAIN ...]
  [--bootstrap-token BOOTSTRAP_TOKEN]
  [--idp {github,google}]
  [--flow {device,pkce}]
  [--no-browser]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--display-name` | value | no | — | Required for a new registration; omit only for a bare resume. |
| `--contact` | value | no | — | Required for a new registration; omit only for a bare resume. |
| `--tenant-domain` | value (repeatable) | no | — | Canonical lowercase business DNS domain to capture as a pending DNS TXT challenge (repeatable, maximum 16). This proves domain control only; it does not create a SPIFFE trust-domain binding. |
| `--workload-spiffe-id` | value (repeatable) | no | — | Concrete workload SPIFFE ID (repeatable). |
| `--parent-tenant-id` | value | no | — | Parent org's tenant_id (its server-allocated tnt-\<uuid\>, from the parent's registration output or `aac tenant list`). The server resolves the handle to its row internally — you always type the identifier, never a database id. |
| `--tenant-admin-pubkey-file` | value | no | — | PEM path — registers the tenant-admin key for publisher ingest. |
| `--spiffe-trust-domain` | value (repeatable) | no | — | Canonical SPIFFE trust domain (e.g. acme.com) to bind to this tenant's scope, explicitly (repeatable — the server never infers a binding from workload IDs). A self-service registration cannot prove and create an UNBOUND binding inline: register with --tenant-domain instead, verify it, then run bind-trust-domain. Ceremony registration may bind inline; a domain already bound to an ancestor is inherited. |
| `--bootstrap-token` | value | no | — | Ceremony bootstrap token for the X-AAC-Bootstrap-Token header (registration is gated: the control plane rejects registration while no ceremony window is open). Falls back to $AAC_BOOTSTRAP_TOKEN. Ignored with --idp (self-serve registration carries federated evidence instead). |
| `--idp` | `github` \| `google` | no | — | Developer-tier self-serve registration: sign in with this identity provider and register WITHOUT a ceremony token — your verified identity becomes the tenant's first tenant-admin. Requires the deployment to enable self-serve registration and to operate a shared connection for the family. |
| `--flow` | `device` \| `pkce` | no | — | With --idp: override the per-IdP sign-in flow selection. |
| `--no-browser` | flag | no | — | With --idp: print the sign-in URL instead of opening a browser tab, and do not offer to open the device-flow page. |

## Output

`--output json` (the default) prints one JSON document to standard output; `--output table` prints a readable table instead. Progress notes and diagnostics go to standard error, so the JSON stays parseable.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | The control plane or the identity provider rejected the request. |
| `2` | Usage error: an invalid flag, value or flag combination. |
| `3` | A local configuration or state problem: profile, credential file, cached session or agent. |
| `4` | Transport failure: an endpoint could not be reached. |
| `130` | Interrupted by the operator (Ctrl-C); a remote change may already have committed. |

## Notes

The tenant id is SERVER-ALLOCATED at registration (canonical form tnt-\<lowercase UUIDv4\>) — there is no --tenant-id here and you never choose one. On success the CLI stores the one-time api_key under ~/.aac/credentials/\<tenant-id\> AND writes the id into the selected profile, binding it. A profile already bound to a tenant refuses registration (fail-closed) — register under a different, unbound profile (--profile/AAC_PROFILE; a named profile must exist — `aac profile create <name>` first); `aac profile list` shows bindings. A bare `aac tenant register` resumes the frozen request only when the selected profile has AAC-managed pending registration state.

## Related commands

- [`aac tenant`](https://docs.cascadeauth.com/cli/reference/aac-tenant/)
- [`aac tenant list`](https://docs.cascadeauth.com/cli/reference/aac-tenant-list/) — List registered tenants visible to your credential (your own tenant, with a session; registration-attribute tier).
- [`aac tenant describe`](https://docs.cascadeauth.com/cli/reference/aac-tenant-describe/) — One tenant's full registration state (API-key METADATA only).
- [`aac tenant issue-domain-challenge`](https://docs.cascadeauth.com/cli/reference/aac-tenant-issue-domain-challenge/) — Issue or rotate the DNS TXT challenge for one tenant business domain.
- [`aac tenant verify-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-verify-domain/) — Resolve and verify the current DNS TXT tenant-domain challenge.
- [`aac tenant release-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-release-domain/) — Voluntarily release one business-domain claim for planned transfer.
- [`aac tenant revoke-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-revoke-domain/) — Terminally revoke one business-domain claim for security or teardown.
- [`aac tenant update`](https://docs.cascadeauth.com/cli/reference/aac-tenant-update/) — Update mutable tenant attributes (sparse: only passed flags change).
- [`aac tenant api-key`](https://docs.cascadeauth.com/cli/reference/aac-tenant-api-key/) — Plan a zero-downtime tenant API-key rotation.
- [`aac tenant reissue-api-key`](https://docs.cascadeauth.com/cli/reference/aac-tenant-reissue-api-key/) — Replace a lost or suspected-compromised tenant API key.
- [`aac tenant add-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-add-workload/) — Add a post-registration workload identity.
- [`aac tenant list-workloads`](https://docs.cascadeauth.com/cli/reference/aac-tenant-list-workloads/) — List this tenant's workload lifecycle records.
- [`aac tenant describe-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-describe-workload/) — Describe one workload lifecycle record by opaque id.
- [`aac tenant update-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-update-workload/) — Set or clear a workload's display name.
- [`aac tenant deactivate-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-deactivate-workload/) — Terminally deactivate a workload.
- [`aac tenant assign-hosted-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-assign-hosted-domain/) — Request the AAC-assigned trust domain for your tenant and save it in the bound profile; repeated calls reuse it.
- [`aac tenant reactivate-hosted-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-reactivate-hosted-domain/) — Reactivate the tenant's AAC-assigned trust domain after a revocation; the name does not change.
- [`aac tenant bind-trust-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-bind-trust-domain/) — Bind a SPIFFE trust domain using current exact-name evidence or ceremony.
- [`aac tenant list-trust-domains`](https://docs.cascadeauth.com/cli/reference/aac-tenant-list-trust-domains/) — List this tenant's trust-domain bindings.
- [`aac tenant rotate-admin-key`](https://docs.cascadeauth.com/cli/reference/aac-tenant-rotate-admin-key/) — Replace this tenant's admin key with a new PUBLIC key.
- [`aac tenant revoke-trust-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-revoke-trust-domain/) — Revoke a trust-domain binding episode by binding id.
