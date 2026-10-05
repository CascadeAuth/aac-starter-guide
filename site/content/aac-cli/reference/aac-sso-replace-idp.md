# `aac sso replace-idp`

Replace one tenant IdP connection from a complete file.

Validates and atomically replaces the complete tenant IdP connection document. Pass the revision observed with `aac sso list-idp`; the CLI sends that operator-pinned precondition with the cached tenant-admin session. During an approved repair ceremony, pass --repair-request-id and --recovery-key-file together; the CLI redeems a repair-only capability internally and never prints or stores it. A retry after a lost response is safe.

## Synopsis

```text
aac sso replace-idp
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
  --connection-id CONNECTION_ID
  --revision REVISION
  --file FILE
  [--repair-request-id REPAIR_REQUEST_ID]
  [--recovery-key-file RECOVERY_KEY_FILE]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--tenant-id` | value | no | — | Tenant whose connection to replace (default: profile/env tenant). |
| `--connection-id` | value | yes | — | Stable idp_connections.id returned by `aac sso list-idp`. |
| `--revision` | value | yes | — | Positive revision observed with `aac sso list-idp`. |
| `--file` | value | yes | — | Complete connection config JSON file (the register-idp file shape). |
| `--repair-request-id` | value | no | — | Approved repair request ID; requires --recovery-key-file. |
| `--recovery-key-file` | value | no | — | Offline recovery private key; requires --repair-request-id. |

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

## Related commands

- [`aac sso`](/cli/reference/aac-sso/)
- [`aac sso register-idp`](/cli/reference/aac-sso-register-idp/) — Register a tenant↔IdP connection.
- [`aac sso generate-idp-recovery-key`](/cli/reference/aac-sso-generate-idp-recovery-key/) — Generate offline tenant IdP recovery-key artifacts.
- [`aac sso enroll-idp-recovery-key`](/cli/reference/aac-sso-enroll-idp-recovery-key/) — Enroll a tenant's IdP recovery public verifier.
- [`aac sso list-idp-recovery-keys`](/cli/reference/aac-sso-list-idp-recovery-keys/) — List IdP recovery-key lifecycle metadata.
- [`aac sso rotate-idp-recovery-key`](/cli/reference/aac-sso-rotate-idp-recovery-key/) — Replace the ACTIVE IdP recovery public verifier.
- [`aac sso revoke-idp-recovery-key`](/cli/reference/aac-sso-revoke-idp-recovery-key/) — Terminally revoke the ACTIVE IdP recovery key.
- [`aac sso request-idp-repair`](/cli/reference/aac-sso-request-idp-repair/) — Sign and submit one exact IdP connection repair request.
- [`aac sso approve-idp-repair`](/cli/reference/aac-sso-approve-idp-repair/) — AAC Ops approves one exact tenant-signed IdP repair.
- [`aac sso list-idp`](/cli/reference/aac-sso-list-idp/) — List safe tenant IdP connection handles without authentication.
- [`aac sso logout`](/cli/reference/aac-sso-logout/) — Delete the cached AAC session for a tenant.
- [`aac sso whoami`](/cli/reference/aac-sso-whoami/) — Show cached session identity/expiry and the profile's saved AAC-assigned domain.
- [`aac sso login`](/cli/reference/aac-sso-login/) — Sign in via your tenant's IdP; caches an AAC session.
