Canonical: https://docs.cascadeauth.com/cli/reference/aac-profile-delete/

Applies to: AAC CLI 0.2.9

Documentation revision: 030a3c3d5e097f2b3e4634e28861322e192f5604

---

# `aac profile delete`

Delete a local profile (never the server-side tenant).

## Synopsis

```text
aac profile delete [-h] [--yes] name
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `name` | value | yes | — | Profile name to delete. |
| `--yes` | flag | no | — | Skip interactive confirmation (automation). Does NOT bypass the `main` or pending-registration guards. |

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | The control plane or the identity provider rejected the request. |
| `2` | Usage error: an invalid flag, value or flag combination. |
| `3` | A local configuration or state problem: profile, credential file, cached session or agent. |
| `4` | Transport failure: an endpoint could not be reached. |

## Notes

Refuses `main` and profiles with unresolved registration state; warns when the profile is bound to a tenant. Credential files are untouched; no network request is made — the server-side tenant is unaffected.

## Related commands

- [`aac profile`](https://docs.cascadeauth.com/cli/reference/aac-profile/)
- [`aac profile list`](https://docs.cascadeauth.com/cli/reference/aac-profile-list/) — List all profiles (selected/binding/pending state).
- [`aac profile show`](https://docs.cascadeauth.com/cli/reference/aac-profile-show/) — Show one profile: stored vs effective values + sources.
- [`aac profile create`](https://docs.cascadeauth.com/cli/reference/aac-profile-create/) — Create a new named profile.
- [`aac profile update`](https://docs.cascadeauth.com/cli/reference/aac-profile-update/) — Update a profile's endpoints (materializes `main`).
