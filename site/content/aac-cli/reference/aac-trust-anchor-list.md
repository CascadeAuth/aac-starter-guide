# `aac trust-anchor list`

All your keys — every lifecycle state, both roles.

## Synopsis

```text
aac trust-anchor list
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
  [--role {root-signing,tenant-admin}]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--tenant-id` | value | no | — | Credential to present. |
| `--role` | `root-signing` \| `tenant-admin` | no | — | Filter to one role (default: both, with a role column). |

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

Shows what .well-known never can: REVOKED keys, expired-grace history, lifecycle timestamps, and your tenant-admin (ingest-signing) keys. Metadata only — `describe` serves the public PEM.

## Related commands

- [`aac trust-anchor`](/cli/reference/aac-trust-anchor/)
- [`aac trust-anchor describe`](/cli/reference/aac-trust-anchor-describe/) — One key: full lifecycle + stored public PEM.
- [`aac trust-anchor revoke`](/cli/reference/aac-trust-anchor-revoke/) — Terminally revoke one root-signing key (session required).
- [`aac trust-anchor ingest-history`](/cli/reference/aac-trust-anchor-ingest-history/) — Accepted publishes from the ingest ledger, newest-first.
