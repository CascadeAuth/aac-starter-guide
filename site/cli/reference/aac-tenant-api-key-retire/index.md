Canonical: https://docs.cascadeauth.com/cli/reference/aac-tenant-api-key-retire/

Applies to: AAC CLI 0.2.11

Documentation revision: 5c77b407625370cd7b937cc1a7578edff5f0d0d0

---

# `aac tenant api-key retire`

Terminally retire one exact ACTIVE key after client migration.

## Synopsis

```text
aac tenant api-key retire
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
  --key-id KEY_ID
  [--yes]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--tenant-id` | value | no | — | Tenant to rotate (defaults to the selected profile identity). |
| `--key-id` | value | yes | — | Exact non-secret ACTIVE key_id selected from `api-key list`. |
| `--yes` | flag | no | — | Confirm the terminal retirement after exact-key preflight. |

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

Retirement requires exactly two ACTIVE keys, is terminal, and never guesses which key is old. Inspect list output and pass the exact non-secret key_id. Rollback remains possible only before retirement by moving clients back to the other ACTIVE key.

## Related commands

- [`aac tenant api-key`](https://docs.cascadeauth.com/cli/reference/aac-tenant-api-key/)
- [`aac tenant api-key list`](https://docs.cascadeauth.com/cli/reference/aac-tenant-api-key-list/) — List the complete at-most-two ACTIVE key metadata set.
- [`aac tenant api-key issue`](https://docs.cascadeauth.com/cli/reference/aac-tenant-api-key-issue/) — Issue and stage a second ACTIVE API key exactly once.
