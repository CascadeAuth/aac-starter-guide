Canonical: https://docs.cascadeauth.com/cli/reference/aac-tenant-api-key-list/

Applies to: AAC CLI 0.2.8

Documentation revision: 6b7d8268ba787d3e9354742259e78153a3a18cae

---

# `aac tenant api-key list`

List the complete at-most-two ACTIVE key metadata set.

## Synopsis

```text
aac tenant api-key list
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--tenant-id` | value | no | — | Tenant to inspect (defaults to the selected profile identity). |

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

Requires the tenant's tenant-admin AAC session. Plaintext, hashes, and pepper values are never returned; pepper_version is only an opaque non-secret routing label.

## Related commands

- [`aac tenant api-key`](https://docs.cascadeauth.com/cli/reference/aac-tenant-api-key/)
- [`aac tenant api-key issue`](https://docs.cascadeauth.com/cli/reference/aac-tenant-api-key-issue/) — Issue and stage a second ACTIVE API key exactly once.
- [`aac tenant api-key retire`](https://docs.cascadeauth.com/cli/reference/aac-tenant-api-key-retire/) — Terminally retire one exact ACTIVE key after client migration.
