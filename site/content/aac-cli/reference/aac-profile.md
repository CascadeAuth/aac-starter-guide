# `aac profile`

Manage local profiles (list/show/create/update/delete).

```text
Profiles are LOCAL named configuration contexts stored in
~/.aac/config, one INI section per profile: endpoint URLs
plus, after a successful registration or login, the
system-managed tenant binding (tenant_id is
written only by those workflows, never edited by hand).

`main` is the reserved baseline profile: always usable, never
created or deleted. Before anything writes it, `main` is
VIRTUAL — backed by built-in endpoint defaults, with no [main]
section in ~/.aac/config yet. The first `aac profile update
main` (or a login/registration binding write) MATERIALIZES it
as a real section. `materialized` in list/show output means
exactly that — the section exists in the config file; it says
nothing about server-side state or connectivity.

Operational commands (tenant/chain/trust-anchor/sso) select
their profile as:

    --profile  >  AAC_PROFILE  >  main

Profile-management commands below take no --profile; they act
on the name you pass.

Deleting a profile never deletes, suspends, or modifies the
server-side tenant.
```

## Synopsis

```text
aac profile [-h] <command> [<args>]
```

## Commands

| Command | Description |
|---|---|
| [`aac profile list`](/cli/reference/aac-profile-list/) | List all profiles (selected/binding/pending state). |
| [`aac profile show`](/cli/reference/aac-profile-show/) | Show one profile: stored vs effective values + sources. |
| [`aac profile create`](/cli/reference/aac-profile-create/) | Create a new named profile. |
| [`aac profile update`](/cli/reference/aac-profile-update/) | Update a profile's endpoints (materializes `main`). |
| [`aac profile delete`](/cli/reference/aac-profile-delete/) | Delete a local profile (never the server-side tenant). |

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |

## Notes

```text
Switching profiles per terminal:

  AAC_PROFILE selects the profile for the current shell only,
  so two terminals can safely target different profiles at
  once.

  Switch this terminal to a profile:

      export AAC_PROFILE=prod

  Switch back to the baseline explicitly:

      export AAC_PROFILE=main

  Remove the override (selection falls back to `main`):

      unset AAC_PROFILE

      # NOT `unset $AAC_PROFILE` — the $ makes the shell
      # expand the VALUE first, so you'd unset a variable
      # named after your profile and AAC_PROFILE survives.

Per-setting env overrides (AAC_ADMIN_URL / AAC_DATA_PLANE_URL /
AAC_TENANT_ID) still outrank the selected profile's stored
values; `aac profile show` labels each effective value's
source.
```

## Related commands

- [`aac`](/cli/reference/)
- [`aac init`](/cli/reference/aac-init/) — Guided setup: register a developer tenant and create a runnable agent.
- [`aac agent`](/cli/reference/aac-agent/) — Inspect and maintain an agent created by `aac init` (status/renew/list).
- [`aac tenant`](/cli/reference/aac-tenant/) — Tenant administration.
- [`aac trust-anchor`](/cli/reference/aac-trust-anchor/) — Inspect YOUR tenant's trust-anchor state (keys + ingest ledger).
- [`aac chain`](/cli/reference/aac-chain/) — Discover chains and inspect their audit observations.
- [`aac sso`](/cli/reference/aac-sso/) — Platform single sign-on: IdP connections, login, sessions and recovery keys.
