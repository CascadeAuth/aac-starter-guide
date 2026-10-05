# `aac agent`

Inspect and maintain an agent created by `aac init` (status/renew/list).

An agent is the folder `aac init` creates under ~/.aac/agents/\<name\>/ holding the files one sidecar needs: `sidecar/` to mount into the sidecar, `agent/` for the paired application, `keep/` for what stays with you, and the settings files beside them. These verbs never create tenants or overwrite keys.

## Synopsis

```text
aac agent [-h] <command> [<args>]
```

## Commands

| Command | Description |
|---|---|
| [`aac agent status`](/cli/reference/aac-agent-status/) | Report what exists, certificate expiry, permission problems and the next command. |
| [`aac agent renew`](/cli/reference/aac-agent-renew/) | Replace the short-lived certificates; archive the old material. |
| [`aac agent list`](/cli/reference/aac-agent-list/) | List every agent under the CLI home with its tenant, case and state. |

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |

## Related commands

- [`aac`](/cli/reference/)
- [`aac init`](/cli/reference/aac-init/) — Guided setup: register a developer tenant and create a runnable agent.
- [`aac profile`](/cli/reference/aac-profile/) — Manage local profiles (list/show/create/update/delete).
- [`aac tenant`](/cli/reference/aac-tenant/) — Tenant administration.
- [`aac trust-anchor`](/cli/reference/aac-trust-anchor/) — Inspect YOUR tenant's trust-anchor state (keys + ingest ledger).
- [`aac chain`](/cli/reference/aac-chain/) — Discover chains and inspect their audit observations.
- [`aac sso`](/cli/reference/aac-sso/) — Platform single sign-on: IdP connections, login, sessions and recovery keys.
