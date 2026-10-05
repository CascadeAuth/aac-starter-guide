# `aac tenant api-key`

Plan a zero-downtime tenant API-key rotation.

## Synopsis

```text
aac tenant api-key [-h] <command> [<args>]
```

## Commands

| Command | Description |
|---|---|
| [`aac tenant api-key list`](/cli/reference/aac-tenant-api-key-list/) | List the complete at-most-two ACTIVE key metadata set. |
| [`aac tenant api-key issue`](/cli/reference/aac-tenant-api-key-issue/) | Issue and stage a second ACTIVE API key exactly once. |
| [`aac tenant api-key retire`](/cli/reference/aac-tenant-api-key-retire/) | Terminally retire one exact ACTIVE key after client migration. |

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |

## Notes

This is the planned two-ACTIVE ceremony: list the exact key ids, issue one staged second key, migrate clients, then terminally retire the chosen old key. Lost or compromised-key recovery stays `aac tenant reissue-api-key`.

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
- [`aac tenant reissue-api-key`](/cli/reference/aac-tenant-reissue-api-key/) — Replace a lost or suspected-compromised tenant API key.
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
