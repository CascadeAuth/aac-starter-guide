Canonical: https://docs.cascadeauth.com/cli/reference/aac-sso-login/

Applies to: AAC CLI 0.2.9

Documentation revision: 030a3c3d5e097f2b3e4634e28861322e192f5604

---

# `aac sso login`

Sign in via your tenant's IdP; caches an AAC session.

Signs in against one of the tenant's registered IdP connections (device flow or loopback PKCE, selected per IdP capability), exchanges the ID token at the AAC STS (RFC 8693), and caches the short-lived session token. Success writes the config profile AND the credential in one motion (aws sso login semantics). Sessions are refresh-less by design: on expiry, run login again.

## Synopsis

```text
aac sso login
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  [--tenant-id TENANT_ID]
  [--idp-url URL | --idp {github,google}]
  [--flow {device,pkce}]
  [--scope SCOPE]
  [--no-browser]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--tenant-id` | value | no | — | Tenant to sign in TO (default: profile/env tenant). |
| `--idp-url` | value | no | — | Which IdP connection to use, by the connection's exact URL (its issuer URL, as registered; needed when several are registered — the error lists the exact commands). |
| `--idp` | `github` \| `google` | no | — | Short form of --idp-url for the shared developer sign-ins: github or google. |
| `--flow` | `device` \| `pkce` | no | — | Override the per-IdP flow selection. |
| `--scope` | value | no | — | OAuth scope for the upstream flow (default: per IdP family — 'openid profile email' for OIDC families, none for GitHub). |
| `--no-browser` | flag | no | — | PKCE flow: print the sign-in URL instead of opening a browser. |

At most one of `--idp-url`, `--idp` may be given.

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

Flow selection: device flow by default (works on headless machines — the browser can be anywhere); Google-family connections prefer loopback PKCE (Google's device flow is scope-restricted). Override with --flow. Connections registered with jwks_static carry no flow endpoints and cannot login interactively.

## Related commands

- [`aac sso`](https://docs.cascadeauth.com/cli/reference/aac-sso/)
- [`aac sso register-idp`](https://docs.cascadeauth.com/cli/reference/aac-sso-register-idp/) — Register a tenant↔IdP connection.
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
