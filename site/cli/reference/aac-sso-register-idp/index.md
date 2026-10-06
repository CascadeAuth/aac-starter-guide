Canonical: https://docs.cascadeauth.com/cli/reference/aac-sso-register-idp/

Applies to: AAC CLI 0.2.9

Documentation revision: 030a3c3d5e097f2b3e4634e28861322e192f5604

---

# `aac sso register-idp`

Register a tenant↔IdP connection.

Registers one tenant↔IdP trust relationship on the control plane: issuer, audience, the three-layer claims mapping, and optional session-TTL overrides. Production registrations trigger server-side OIDC discovery on the issuer; a jwks_static member in the file skips discovery (dev/compose stacks only).

## Synopsis

```text
aac sso register-idp
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
  --file FILE
  [--bootstrap-token BOOTSTRAP_TOKEN]
  [--shared]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--tenant-id` | value | no | — | Tenant to register the connection FOR (default: profile/env tenant). |
| `--file` | value | yes | — | Connection config JSON file (aws --cli-input-json idiom; see epilog). |
| `--bootstrap-token` | value | no | empty | Ceremony bootstrap token for the X-AAC-Bootstrap-Token header (first-IdP onboarding; falls back to $AAC_BOOTSTRAP_TOKEN). |
| `--shared` | flag | no | — | Register a SHARED developer-tier connection (github/google) owned by the platform, not a tenant — a platform operator ceremony (--bootstrap-token required; --tenant-id ignored). The connection file omits binding_claims/groups_claim/role_map (roles come from principal→tenant bindings) and may carry public_client_secret (Google) or jwks_static {"keys": []} + explicit endpoints (GitHub). |

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

## Notes

```text
example connection.json (Entra):
  {
    "issuer": "https://login.microsoftonline.com/<tid>/v2.0",
    "family": "entra",
    "expected_audience": "<Application (client) ID — the GUID, not the app name>",
    "binding_claims": {"tid": "<tid>"},
    "groups_claim": "groups",
    "role_map": {"<group-object-id>": ["tenant-admin"]}
  }

First-IdP onboarding runs under the ops ceremony (--bootstrap-token / $AAC_BOOTSTRAP_TOKEN); adding further IdPs self-serve uses your session (aac sso login).
```

## Related commands

- [`aac sso`](https://docs.cascadeauth.com/cli/reference/aac-sso/)
- [`aac sso generate-idp-recovery-key`](https://docs.cascadeauth.com/cli/reference/aac-sso-generate-idp-recovery-key/) — Generate offline tenant IdP recovery-key artifacts.
- [`aac sso enroll-idp-recovery-key`](https://docs.cascadeauth.com/cli/reference/aac-sso-enroll-idp-recovery-key/) — Enroll a tenant's IdP recovery public verifier.
- [`aac sso list-idp-recovery-keys`](https://docs.cascadeauth.com/cli/reference/aac-sso-list-idp-recovery-keys/) — List IdP recovery-key lifecycle metadata.
- [`aac sso rotate-idp-recovery-key`](https://docs.cascadeauth.com/cli/reference/aac-sso-rotate-idp-recovery-key/) — Replace the ACTIVE IdP recovery public verifier.
- [`aac sso revoke-idp-recovery-key`](https://docs.cascadeauth.com/cli/reference/aac-sso-revoke-idp-recovery-key/) — Terminally revoke the ACTIVE IdP recovery key.
- [`aac sso request-idp-repair`](https://docs.cascadeauth.com/cli/reference/aac-sso-request-idp-repair/) — Sign and submit one exact IdP connection repair request.
- [`aac sso approve-idp-repair`](https://docs.cascadeauth.com/cli/reference/aac-sso-approve-idp-repair/) — AAC Ops approves one exact tenant-signed IdP repair.
- [`aac sso list-idp`](https://docs.cascadeauth.com/cli/reference/aac-sso-list-idp/) — List safe tenant IdP connection handles without authentication.
- [`aac sso replace-idp`](https://docs.cascadeauth.com/cli/reference/aac-sso-replace-idp/) — Replace one tenant IdP connection from a complete file.
- [`aac sso logout`](https://docs.cascadeauth.com/cli/reference/aac-sso-logout/) — Delete the cached AAC session for a tenant.
- [`aac sso whoami`](https://docs.cascadeauth.com/cli/reference/aac-sso-whoami/) — Show cached session identity/expiry and the profile's saved AAC-assigned domain.
- [`aac sso login`](https://docs.cascadeauth.com/cli/reference/aac-sso-login/) — Sign in via your tenant's IdP; caches an AAC session.
