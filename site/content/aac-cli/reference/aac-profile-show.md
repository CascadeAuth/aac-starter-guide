# `aac profile show`

Show one profile: stored vs effective values + sources.

## Synopsis

```text
aac profile show [-h] [--field {tenant-id} | --output {json,table}] [name]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `name` | value | no | — | Profile name (default: selected). |
| `--field` | `tenant-id` | no | — | Print the effective tenant ID (AAC_TENANT_ID overrides stored binding); fail if unavailable. Cannot combine with --output. |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |

At most one of `--field`, `--output` may be given.

## Output

`--output json` (the default) prints one JSON document to standard output; `--output table` prints a readable table instead. Progress notes and diagnostics go to standard error, so the JSON stays parseable.

`--field` prints one unquoted value followed by a newline instead. It cannot be combined with an explicit `--output`. A missing or invalid value fails without scalar output; diagnostics go to standard error.

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

With no name, shows the SELECTED profile (AAC_PROFILE or `main`). Setting-specific env overrides (AAC_ADMIN_URL / AAC_DATA_PLANE_URL / AAC_TENANT_ID) still apply to the effective values and are labeled as their source. Structured inspection remains available for stale bindings: binding.error identifies the problem, and invalid stored/effective tenant IDs are redacted as null with an error. --field tenant-id fails with exit 3 and empty stdout for an invalid stored binding, even with a valid environment override. Repair the local association with `aac profile update NAME --unbind`, then sign in to the intended tenant.

## Related commands

- [`aac profile`](/cli/reference/aac-profile/)
- [`aac profile list`](/cli/reference/aac-profile-list/) — List all profiles (selected/binding/pending state).
- [`aac profile create`](/cli/reference/aac-profile-create/) — Create a new named profile.
- [`aac profile update`](/cli/reference/aac-profile-update/) — Update a profile's endpoints or clear its local tenant binding.
- [`aac profile delete`](/cli/reference/aac-profile-delete/) — Delete a local profile (never the server-side tenant).
