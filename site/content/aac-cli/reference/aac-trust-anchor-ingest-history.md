# `aac trust-anchor ingest-history`

Accepted publishes from the ingest ledger, newest-first.

## Synopsis

```text
aac trust-anchor ingest-history
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
  [--artifact-class {root-keys,spiffe-bundle}]
  [--limit LIMIT]
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
| `--artifact-class` | `root-keys` \| `spiffe-bundle` | no | — | Filter to one artifact class (default: both). |
| `--limit` | integer | no | `50` | Max ledger rows to fetch (server cap 500). |

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

## Related commands

- [`aac trust-anchor`](/cli/reference/aac-trust-anchor/)
- [`aac trust-anchor list`](/cli/reference/aac-trust-anchor-list/) — All your keys — every lifecycle state, both roles.
- [`aac trust-anchor describe`](/cli/reference/aac-trust-anchor-describe/) — One key: full lifecycle + stored public PEM.
- [`aac trust-anchor revoke`](/cli/reference/aac-trust-anchor-revoke/) — Terminally revoke one root-signing key (session required).
