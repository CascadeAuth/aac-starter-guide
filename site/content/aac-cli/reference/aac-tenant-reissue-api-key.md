# `aac tenant reissue-api-key`

Replace a lost or suspected-compromised tenant API key.

## Synopsis

```text
aac tenant reissue-api-key
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
  [--registration-request-id REGISTRATION_REQUEST_ID]
  [--bootstrap-token BOOTSTRAP_TOKEN]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--tenant-id` | value | no | — | Tenant to reissue (defaults to the selected profile identity). |
| `--registration-request-id` | value | no | — | Completed treq-\* locator; required only with operator-assisted onboarding recovery and never an authorizer. |
| `--bootstrap-token` | value | no | — | AAC Ops ceremony credential for operator-assisted onboarding recovery. Falls back to $AAC_BOOTSTRAP_TOKEN. Ordinary tenant administrators omit this and use their cached AAC session. |

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

## Notes

Immediate replacement: every ACTIVE tenant API key is revoked atomically and one new key is returned exactly once. There is no grace window and this is NOT tenant-admin Ed25519-key rotation. If a response is lost, run this command again; the new attempt revokes the unknown result. The CLI never retries automatically. Ordinary use requires the tenant's tenant-admin AAC session. During initial onboarding only, AAC Ops may use an explicitly opened ceremony with both --bootstrap-token and the matching --registration-request-id. The registration id locates the tenant and never authorizes the operation.

## Related commands

- [`aac tenant`](/cli/reference/aac-tenant/)
- [`aac tenant register`](/cli/reference/aac-tenant-register/) — Register a tenant or resume this profile's pending registration.
- [`aac tenant list`](/cli/reference/aac-tenant-list/) — List registered tenants visible to your credential (your own tenant, with a session; registration-attribute tier).
- [`aac tenant describe`](/cli/reference/aac-tenant-describe/) — One tenant's full registration state (API-key METADATA only).
- [`aac tenant issue-domain-challenge`](/cli/reference/aac-tenant-issue-domain-challenge/) — Issue or rotate the DNS TXT challenge for one tenant business domain.
- [`aac tenant verify-domain`](/cli/reference/aac-tenant-verify-domain/) — Resolve and verify the current DNS TXT tenant-domain challenge.
- [`aac tenant release-domain`](/cli/reference/aac-tenant-release-domain/) — Voluntarily release one business-domain claim for planned transfer.
- [`aac tenant revoke-domain`](/cli/reference/aac-tenant-revoke-domain/) — Terminally revoke one business-domain claim for security or teardown.
- [`aac tenant update`](/cli/reference/aac-tenant-update/) — Update mutable tenant attributes (sparse: only passed flags change).
- [`aac tenant api-key`](/cli/reference/aac-tenant-api-key/) — Plan a zero-downtime tenant API-key rotation.
- [`aac tenant add-workload`](/cli/reference/aac-tenant-add-workload/) — Add a post-registration workload identity.
- [`aac tenant list-workloads`](/cli/reference/aac-tenant-list-workloads/) — List this tenant's workload lifecycle records.
- [`aac tenant describe-workload`](/cli/reference/aac-tenant-describe-workload/) — Describe one workload lifecycle record by opaque id.
- [`aac tenant update-workload`](/cli/reference/aac-tenant-update-workload/) — Set or clear a workload's display name.
- [`aac tenant deactivate-workload`](/cli/reference/aac-tenant-deactivate-workload/) — Terminally deactivate a workload.
- [`aac tenant assign-hosted-domain`](/cli/reference/aac-tenant-assign-hosted-domain/) — Request the AAC-assigned trust domain for your tenant and save it in the bound profile; repeated calls reuse it.
- [`aac tenant reactivate-hosted-domain`](/cli/reference/aac-tenant-reactivate-hosted-domain/) — Reactivate the tenant's AAC-assigned trust domain after a revocation; the name does not change.
- [`aac tenant bind-trust-domain`](/cli/reference/aac-tenant-bind-trust-domain/) — Bind a SPIFFE trust domain using current exact-name evidence or ceremony.
- [`aac tenant list-trust-domains`](/cli/reference/aac-tenant-list-trust-domains/) — List this tenant's trust-domain bindings.
- [`aac tenant rotate-admin-key`](/cli/reference/aac-tenant-rotate-admin-key/) — Replace this tenant's admin key with a new PUBLIC key.
- [`aac tenant revoke-trust-domain`](/cli/reference/aac-tenant-revoke-trust-domain/) — Revoke a trust-domain binding episode by binding id.
