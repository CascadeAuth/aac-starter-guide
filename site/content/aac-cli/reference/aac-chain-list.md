# `aac chain list`

List observed chains visible to your tenant.

Query central observations only; no local files are read. Central evidence may be incomplete because forwarding is best effort.

## Synopsis

```text
aac chain list
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
  [--since SINCE]
  [--from FROM_TIME]
  [--to TO_TIME]
  [--limit LIMIT]
  [--page-token PAGE_TOKEN]
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
| `--since` | value | no | — | Positive integer hours or days (default 24h; maximum 31d). Cannot accompany a page token or explicit interval. |
| `--from` | value | no | — | Inclusive RFC3339 activity time with timezone; requires --to. |
| `--to` | value | no | — | Exclusive RFC3339 activity time with timezone; requires --from. Maximum interval 31 days. |
| `--limit` | integer | no | — | Rows per page (default 50, maximum 200; continuation preserves original size). |
| `--page-token` | value | no | — | Opaque continuation from next_page_token (expires after 15 minutes). |

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

Each invocation fetches one page. Continue using --page-token alone to preserve the resolved interval and page size. Pagination is live: late arrivals can change rows or be missed before the last returned root. Repeat the original interval to refresh. Connected composite roots remain distinct rows. Times, outcomes and counts are observations, not chain completion or execution totals.

## Related commands

- [`aac chain`](/cli/reference/aac-chain/)
- [`aac chain show`](/cli/reference/aac-chain-show/) — Chronological cross-org timeline (participant tenants only).
