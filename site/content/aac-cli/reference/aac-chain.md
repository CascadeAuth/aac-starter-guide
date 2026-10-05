# `aac chain`

Discover chains and inspect their audit observations.

## Synopsis

```text
aac chain [-h] <command> [<args>]
```

## Commands

| Command | Description |
|---|---|
| [`aac chain list`](/cli/reference/aac-chain-list/) | List observed chains visible to your tenant. |
| [`aac chain show`](/cli/reference/aac-chain-show/) | Chronological cross-org timeline (participant tenants only). |

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |

## Related commands

- [`aac`](/cli/reference/)
- [`aac init`](/cli/reference/aac-init/) — Guided setup: register a developer tenant and create a runnable agent.
- [`aac agent`](/cli/reference/aac-agent/) — Inspect and maintain an agent created by `aac init` (status/renew/list).
- [`aac profile`](/cli/reference/aac-profile/) — Manage local profiles (list/show/create/update/delete).
- [`aac tenant`](/cli/reference/aac-tenant/) — Tenant administration.
- [`aac trust-anchor`](/cli/reference/aac-trust-anchor/) — Inspect YOUR tenant's trust-anchor state (keys + ingest ledger).
- [`aac sso`](/cli/reference/aac-sso/) — Platform single sign-on: IdP connections, login, sessions and recovery keys.
