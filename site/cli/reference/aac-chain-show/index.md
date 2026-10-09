Canonical: https://docs.cascadeauth.com/cli/reference/aac-chain-show/

Applies to: AAC CLI 0.2.10

Documentation revision: 8ac907aefe6d0ee5890eb6ea197f8b469306f03c

---

# `aac chain show`

Chronological cross-org timeline (participant tenants only).

## Synopsis

```text
aac chain show
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  --token-id TOKEN_ID
  [--tenant-id TENANT_ID]
  [--render]
  [--render-out RENDER_OUT]
  [--open]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--token-id`, `--root-token-id` | value | yes | — | Any hop's token id OR a chain root id (64-char hex). |
| `--tenant-id` | value | no | — | Credential to present. |
| `--render` | flag | no | — | Also fetch the interactive HTML AEG to a file (headless-first). |
| `--render-out` | value | no | — | HTML output path (default aeg_\<root\>.html). |
| `--open` | flag | no | — | Open the rendered AEG in a browser. |

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

- [`aac chain`](https://docs.cascadeauth.com/cli/reference/aac-chain/)
- [`aac chain list`](https://docs.cascadeauth.com/cli/reference/aac-chain-list/) — List observed chains visible to your tenant.
