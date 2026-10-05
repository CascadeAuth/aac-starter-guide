# `aac profile update`

Update a profile's endpoints (materializes `main`).

## Synopsis

```text
aac profile update [-h] [--admin-url ADMIN_URL] [--data-plane-url DATA_PLANE_URL] name
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `name` | value | yes | — | Profile name (`main` allowed). |
| `--admin-url` | value | no | — | Store this admin_url (skips its prompt). |
| `--data-plane-url` | value | no | — | Store this data_plane_url (skips its prompt). |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | The control plane or the identity provider rejected the request. |
| `2` | Usage error: an invalid flag, value or flag combination. |
| `3` | A local configuration or state problem: profile, credential file, cached session or agent. |
| `4` | Transport failure: an endpoint could not be reached. |

## Notes

Flags give a scriptable sparse update; in a terminal, omitted endpoints show the current value in brackets and Enter preserves it. tenant_id is displayed but not editable.

## Related commands

- [`aac profile`](/cli/reference/aac-profile/)
- [`aac profile list`](/cli/reference/aac-profile-list/) — List all profiles (selected/binding/pending state).
- [`aac profile show`](/cli/reference/aac-profile-show/) — Show one profile: stored vs effective values + sources.
- [`aac profile create`](/cli/reference/aac-profile-create/) — Create a new named profile.
- [`aac profile delete`](/cli/reference/aac-profile-delete/) — Delete a local profile (never the server-side tenant).
