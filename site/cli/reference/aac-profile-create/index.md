Canonical: https://docs.cascadeauth.com/cli/reference/aac-profile-create/

Applies to: AAC CLI 0.2.8

Documentation revision: 6b7d8268ba787d3e9354742259e78153a3a18cae

---

# `aac profile create`

Create a new named profile.

## Synopsis

```text
aac profile create [-h] [--admin-url ADMIN_URL] [--data-plane-url DATA_PLANE_URL] name
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `name` | value | yes | — | Profile name: 3-15 characters, lowercase a-z, digits and single interior hyphens, with at least one letter. |
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

Endpoint flags make creation fully scriptable; in a terminal, omitted endpoints are prompted with built-in defaults in brackets. tenant_id is system-managed and never asked for (registration/login write it).

## Related commands

- [`aac profile`](https://docs.cascadeauth.com/cli/reference/aac-profile/)
- [`aac profile list`](https://docs.cascadeauth.com/cli/reference/aac-profile-list/) — List all profiles (selected/binding/pending state).
- [`aac profile show`](https://docs.cascadeauth.com/cli/reference/aac-profile-show/) — Show one profile: stored vs effective values + sources.
- [`aac profile update`](https://docs.cascadeauth.com/cli/reference/aac-profile-update/) — Update a profile's endpoints (materializes `main`).
- [`aac profile delete`](https://docs.cascadeauth.com/cli/reference/aac-profile-delete/) — Delete a local profile (never the server-side tenant).
