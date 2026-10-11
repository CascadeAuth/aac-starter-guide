Canonical: https://docs.cascadeauth.com/cli/reference/aac-profile-update/

Applies to: AAC CLI 0.2.11

Documentation revision: 5c77b407625370cd7b937cc1a7578edff5f0d0d0

---

# `aac profile update`

Update a profile's endpoints or clear its local tenant binding.

```text
A profile stores endpoints and a default AAC tenant in ~/.aac/config
(or $AAC_CLI_HOME/config). Its binding is the local association between
the profile name and tenant_id.

--unbind removes tenant_id and its saved hosted_trust_domain from that
section. Endpoints, other settings/profiles, credential files, existing
agent records and the server-side tenant remain. It does not sign out,
revoke membership, change an identity provider or
unset environment overrides such as AAC_TENANT_ID.
```

## Synopsis

```text
aac profile update [-h] [--unbind] [--admin-url ADMIN_URL] [--data-plane-url DATA_PLANE_URL] name
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `name` | value | yes | — | Profile name (`main` allowed). |
| `--unbind` | flag | no | — | Clear the local tenant binding and hosted-domain metadata; preserve endpoints and credentials. |
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
| `130` | Interrupted by the operator (Ctrl-C); a remote change may already have committed. |

## Notes

```text
Use --unbind to clear a stale tenant association. An endpoint correction
or an expired session normally does not require unbinding. The profile
may remain unbound, with its endpoints available for later use.

Clear the stale association:

    aac profile update stage --unbind

Bind profile stage to the correct EXISTING tenant:

    aac sso login --profile stage --tenant-id <TENANT_ID>

The verb is login, but successful authentication also binds the profile
by saving its tenant_id. Replace <TENANT_ID> with the intended tenant's
canonical ID. The binding is saved only after authentication succeeds.

To create a NEW tenant,
use `aac tenant register --profile NAME` with its registration inputs;
success saves the newly allocated ID. There is no --bind flag: these
authenticated workflows establish the binding.

--unbind works on main and already-unbound profiles, may accompany
endpoint flags, and never prompts for endpoints. Unresolved registration
or API-key rotation state blocks unbinding; finish recovery first.

Without --unbind, flags give a sparse endpoint update; an interactive
edit shows current values in brackets and Enter preserves them. Config
writes are atomic; the INI writer may normalize formatting and drop
comments. Profile management cannot assign a replacement tenant ID.
```

## Related commands

- [`aac profile`](https://docs.cascadeauth.com/cli/reference/aac-profile/)
- [`aac profile list`](https://docs.cascadeauth.com/cli/reference/aac-profile-list/) — List all profiles (selected/binding/pending state).
- [`aac profile show`](https://docs.cascadeauth.com/cli/reference/aac-profile-show/) — Show one profile: stored vs effective values + sources.
- [`aac profile create`](https://docs.cascadeauth.com/cli/reference/aac-profile-create/) — Create a new named profile.
- [`aac profile delete`](https://docs.cascadeauth.com/cli/reference/aac-profile-delete/) — Delete a local profile (never the server-side tenant).
