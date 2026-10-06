Canonical: https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-describe/

Applies to: AAC CLI 0.2.9

Documentation revision: 030a3c3d5e097f2b3e4634e28861322e192f5604

---

# `aac trust-anchor describe`

One key: full lifecycle + stored public PEM.

## Synopsis

```text
aac trust-anchor describe
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
  --kid KID
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
| `--kid` | value | yes | — | The key_id to describe (yours only). |

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

## Related commands

- [`aac trust-anchor`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor/)
- [`aac trust-anchor list`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-list/) — All your keys — every lifecycle state, both roles.
- [`aac trust-anchor revoke`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-revoke/) — Terminally revoke one root-signing key (session required).
- [`aac trust-anchor ingest-history`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-ingest-history/) — Accepted publishes from the ingest ledger, newest-first.
