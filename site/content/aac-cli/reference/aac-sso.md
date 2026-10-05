# `aac sso`

Platform single sign-on: IdP connections, login, sessions and recovery keys.

## Synopsis

```text
aac sso [-h] <command> [<args>]
```

## Commands

| Command | Description |
|---|---|
| [`aac sso register-idp`](/cli/reference/aac-sso-register-idp/) | Register a tenant↔IdP connection. |
| [`aac sso generate-idp-recovery-key`](/cli/reference/aac-sso-generate-idp-recovery-key/) | Generate offline tenant IdP recovery-key artifacts. |
| [`aac sso enroll-idp-recovery-key`](/cli/reference/aac-sso-enroll-idp-recovery-key/) | Enroll a tenant's IdP recovery public verifier. |
| [`aac sso list-idp-recovery-keys`](/cli/reference/aac-sso-list-idp-recovery-keys/) | List IdP recovery-key lifecycle metadata. |
| [`aac sso rotate-idp-recovery-key`](/cli/reference/aac-sso-rotate-idp-recovery-key/) | Replace the ACTIVE IdP recovery public verifier. |
| [`aac sso revoke-idp-recovery-key`](/cli/reference/aac-sso-revoke-idp-recovery-key/) | Terminally revoke the ACTIVE IdP recovery key. |
| [`aac sso request-idp-repair`](/cli/reference/aac-sso-request-idp-repair/) | Sign and submit one exact IdP connection repair request. |
| [`aac sso approve-idp-repair`](/cli/reference/aac-sso-approve-idp-repair/) | AAC Ops approves one exact tenant-signed IdP repair. |
| [`aac sso list-idp`](/cli/reference/aac-sso-list-idp/) | List safe tenant IdP connection handles without authentication. |
| [`aac sso replace-idp`](/cli/reference/aac-sso-replace-idp/) | Replace one tenant IdP connection from a complete file. |
| [`aac sso logout`](/cli/reference/aac-sso-logout/) | Delete the cached AAC session for a tenant. |
| [`aac sso whoami`](/cli/reference/aac-sso-whoami/) | Show cached session identity/expiry and the profile's saved AAC-assigned domain. |
| [`aac sso login`](/cli/reference/aac-sso-login/) | Sign in via your tenant's IdP; caches an AAC session. |

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
- [`aac chain`](/cli/reference/aac-chain/) — Discover chains and inspect their audit observations.
