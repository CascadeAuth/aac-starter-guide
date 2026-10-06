Canonical: https://docs.cascadeauth.com/cli/reference/aac-profile-show/

Applies to: AAC CLI 0.2.9

Documentation revision: 030a3c3d5e097f2b3e4634e28861322e192f5604

---

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

## Notes

With no name, shows the SELECTED profile (AAC_PROFILE or `main`). Setting-specific env overrides (AAC_ADMIN_URL / AAC_DATA_PLANE_URL / AAC_TENANT_ID) still apply to the effective values and are labeled as their source.

## Related commands

- [`aac profile`](https://docs.cascadeauth.com/cli/reference/aac-profile/)
- [`aac profile list`](https://docs.cascadeauth.com/cli/reference/aac-profile-list/) — List all profiles (selected/binding/pending state).
- [`aac profile create`](https://docs.cascadeauth.com/cli/reference/aac-profile-create/) — Create a new named profile.
- [`aac profile update`](https://docs.cascadeauth.com/cli/reference/aac-profile-update/) — Update a profile's endpoints (materializes `main`).
- [`aac profile delete`](https://docs.cascadeauth.com/cli/reference/aac-profile-delete/) — Delete a local profile (never the server-side tenant).
