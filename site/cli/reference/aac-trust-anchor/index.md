Canonical: https://docs.cascadeauth.com/cli/reference/aac-trust-anchor/

Applies to: AAC CLI 0.2.11

Documentation revision: a4b073409b4b2f23d4b22c518a5adfa1d6bd895e

---

# `aac trust-anchor`

Inspect YOUR tenant's trust-anchor state (keys + ingest ledger).

## Synopsis

```text
aac trust-anchor [-h] <command> [<args>]
```

## Commands

| Command | Description |
|---|---|
| [`aac trust-anchor list`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-list/) | All your keys — every lifecycle state, both roles. |
| [`aac trust-anchor describe`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-describe/) | One key: full lifecycle + stored public PEM. |
| [`aac trust-anchor revoke`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-revoke/) | Terminally revoke one root-signing key (session required). |
| [`aac trust-anchor ingest-history`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor-ingest-history/) | Accepted publishes from the ingest ledger, newest-first. |

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
- [`aac chain`](https://docs.cascadeauth.com/cli/reference/aac-chain/) — Discover chains and inspect their audit observations.
- [`aac sso`](https://docs.cascadeauth.com/cli/reference/aac-sso/) — Platform single sign-on: IdP connections, login, sessions and recovery keys.
