Canonical: https://docs.cascadeauth.com/cli/reference/aac-sso-revoke-idp-recovery-key/

Applies to: AAC CLI 0.2.11

Documentation revision: 5c77b407625370cd7b937cc1a7578edff5f0d0d0

---

# `aac sso revoke-idp-recovery-key`

Terminally revoke the ACTIVE IdP recovery key.

## Synopsis

```text
aac sso revoke-idp-recovery-key
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
  --recovery-key-id RECOVERY_KEY_ID
  --reason REASON
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--tenant-id` | value | no | — |  |
| `--recovery-key-id` | value | yes | — |  |
| `--reason` | value | yes | — | Required audit reason (1-512 characters). |

## Output

`--output json` (the default) prints one JSON document to standard output; `--output table` prints a readable table instead. Progress notes and diagnostics go to standard error, so the JSON stays parseable.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | The control plane or the identity provider rejected the request. |
| `2` | Usage error: an invalid flag, value or flag combination. |
| `3` | A local configuration or state problem: profile, credential file, cached session or agent. |
| `4` | Transport failure: an endpoint could not be reached. |
| `130` | Interrupted by the operator (Ctrl-C); a remote change may already have committed. |

## Related commands

- [`aac sso`](https://docs.cascadeauth.com/cli/reference/aac-sso/)
- [`aac sso describe`](https://docs.cascadeauth.com/cli/reference/aac-sso-describe/) — Public SSO login descriptor as JSON; no login needed.
- [`aac sso register-idp`](https://docs.cascadeauth.com/cli/reference/aac-sso-register-idp/) — Register a tenant↔IdP connection.
- [`aac sso generate-idp-recovery-key`](https://docs.cascadeauth.com/cli/reference/aac-sso-generate-idp-recovery-key/) — Generate offline tenant IdP recovery-key artifacts.
- [`aac sso enroll-idp-recovery-key`](https://docs.cascadeauth.com/cli/reference/aac-sso-enroll-idp-recovery-key/) — Enroll a tenant's IdP recovery public verifier.
- [`aac sso list-idp-recovery-keys`](https://docs.cascadeauth.com/cli/reference/aac-sso-list-idp-recovery-keys/) — List IdP recovery-key lifecycle metadata.
- [`aac sso rotate-idp-recovery-key`](https://docs.cascadeauth.com/cli/reference/aac-sso-rotate-idp-recovery-key/) — Replace the ACTIVE IdP recovery public verifier.
- [`aac sso request-idp-repair`](https://docs.cascadeauth.com/cli/reference/aac-sso-request-idp-repair/) — Sign and submit one exact IdP connection repair request.
- [`aac sso approve-idp-repair`](https://docs.cascadeauth.com/cli/reference/aac-sso-approve-idp-repair/) — AAC Ops approves one exact tenant-signed IdP repair.
- [`aac sso list-idp`](https://docs.cascadeauth.com/cli/reference/aac-sso-list-idp/) — List safe tenant IdP connection handles without authentication.
- [`aac sso replace-idp`](https://docs.cascadeauth.com/cli/reference/aac-sso-replace-idp/) — Replace one tenant IdP connection from a complete file.
- [`aac sso logout`](https://docs.cascadeauth.com/cli/reference/aac-sso-logout/) — Delete the cached AAC session for a tenant.
- [`aac sso whoami`](https://docs.cascadeauth.com/cli/reference/aac-sso-whoami/) — Show cached session identity/expiry and the profile's saved AAC-assigned domain.
- [`aac sso login`](https://docs.cascadeauth.com/cli/reference/aac-sso-login/) — Sign in via your tenant's IdP; caches an AAC session.
