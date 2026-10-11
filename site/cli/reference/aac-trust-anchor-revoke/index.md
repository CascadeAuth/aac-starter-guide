Canonical: https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-revoke/

Applies to: AAC CLI 0.2.11

Documentation revision: a4b073409b4b2f23d4b22c518a5adfa1d6bd895e

---

# `aac trust-anchor revoke`

Terminally revoke one root-signing key (session required).

## Synopsis

```text
aac trust-anchor revoke
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
  --kid KID
  --reason REASON
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--tenant-id` | value | no | — | Tenant owning the root key. |
| `--kid` | value | yes | — | Root-signing key_id to revoke. |
| `--reason` | value | yes | — | Audited terminal revocation reason (maximum 512 characters). |

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

This is an emergency/teardown mutation: it may revoke the last root key, cannot be undone, and deliberately has no bootstrap-token or tenant-API-key alternate. Healthy control-plane-backed receivers converge on their next poll; revocation is not globally instantaneous.

## Related commands

- [`aac trust-anchor`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor/)
- [`aac trust-anchor list`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-list/) — All your keys — every lifecycle state, both roles.
- [`aac trust-anchor describe`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-describe/) — One key: full lifecycle + stored public PEM.
- [`aac trust-anchor ingest-history`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-ingest-history/) — Accepted publishes from the ingest ledger, newest-first.
