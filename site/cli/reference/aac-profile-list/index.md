Canonical: https://docs.cascadeauth.com/cli/reference/aac-profile-list/

Applies to: AAC CLI 0.2.8

Documentation revision: 6b7d8268ba787d3e9354742259e78153a3a18cae

---

# `aac profile list`

List all profiles (selected/binding/pending state).

## Synopsis

```text
aac profile list [-h] [--output {json,table}]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |

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

- [`aac profile`](https://docs.cascadeauth.com/cli/reference/aac-profile/)
- [`aac profile show`](https://docs.cascadeauth.com/cli/reference/aac-profile-show/) — Show one profile: stored vs effective values + sources.
- [`aac profile create`](https://docs.cascadeauth.com/cli/reference/aac-profile-create/) — Create a new named profile.
- [`aac profile update`](https://docs.cascadeauth.com/cli/reference/aac-profile-update/) — Update a profile's endpoints (materializes `main`).
- [`aac profile delete`](https://docs.cascadeauth.com/cli/reference/aac-profile-delete/) — Delete a local profile (never the server-side tenant).
