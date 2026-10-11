Canonical: https://docs.cascadeauth.com/cli/reference/aac-chain/

Applies to: AAC CLI 0.2.11

Documentation revision: 5c77b407625370cd7b937cc1a7578edff5f0d0d0

---

# `aac chain`

Discover chains and inspect their audit observations.

## Synopsis

```text
aac chain [-h] <command> [<args>]
```

## Commands

| Command | Description |
|---|---|
| [`aac chain list`](https://docs.cascadeauth.com/cli/reference/aac-chain-list/) | List observed chains visible to your tenant. |
| [`aac chain show`](https://docs.cascadeauth.com/cli/reference/aac-chain-show/) | Chronological cross-org timeline (participant tenants only). |

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |

## Related commands

- [`aac`](https://docs.cascadeauth.com/cli/reference/)
- [`aac init`](https://docs.cascadeauth.com/cli/reference/aac-init/) — Guided setup: register a developer tenant and create a runnable agent.
- [`aac agent`](https://docs.cascadeauth.com/cli/reference/aac-agent/) — Inspect and maintain an agent created by `aac init` (status/renew/list).
- [`aac profile`](https://docs.cascadeauth.com/cli/reference/aac-profile/) — Manage local profiles (list/show/create/update/delete).
- [`aac tenant`](https://docs.cascadeauth.com/cli/reference/aac-tenant/) — Tenant administration.
- [`aac trust-anchor`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor/) — Inspect YOUR tenant's trust-anchor state (keys + ingest ledger).
- [`aac sso`](https://docs.cascadeauth.com/cli/reference/aac-sso/) — Platform single sign-on: IdP connections, login, sessions and recovery keys.
