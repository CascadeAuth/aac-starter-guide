Canonical: https://docs.cascadeauth.com/cli/reference/aac-sso-describe/

Applies to: AAC CLI 0.2.10

Documentation revision: 8ac907aefe6d0ee5890eb6ea197f8b469306f03c

---

# `aac sso describe`

Public SSO login descriptor as JSON; no login needed.

```text
Read public SSO login information without credentials.

Without --tenant-id, show shared/platform sign-in connections.
With --tenant-id, show that tenant's connections and shared ones.

To include a tenant's connections, pass --tenant-id explicitly.
A tenant saved in your profile or set through the AAC_TENANT_ID
environment variable does not automatically select the tenant
descriptor.

The CLI still checks your local configuration and selected profile.
If it reports an invalid stored tenant binding, clear it with:

    aac profile update NAME --unbind

Replace NAME with the affected profile's name, then retry this command.

Print the complete public descriptor as JSON on stdout.
This command does not sign in, bind a profile, or change credentials.
```

## Synopsis

```text
aac sso describe
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json}]
  [--tenant-id TENANT_ID]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to use (--profile \> AAC_PROFILE \> main). Run `aac profile list` to see your local profiles. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` | no | `json` | Output mode: json. |
| `--tenant-id` | value | no | — | Explicit tenant to describe; omitted means shared/platform candidates only. |

## Output

`--output json` (the default) prints one JSON document to standard output. This command supports JSON output only. Progress notes and diagnostics go to standard error, so the JSON stays parseable.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | The control plane or the identity provider rejected the request. |
| `2` | Usage error: an invalid flag, value or flag combination. |
| `3` | A local configuration or state problem: profile, credential file, cached session or agent. |
| `4` | Transport failure: an endpoint could not be reached. |
| `130` | Interrupted by the operator (Ctrl-C); a remote change may already have committed. |

## Notes

```text
Shared sign-in candidates:
    aac sso describe --profile stage

An existing tenant's sign-in candidates:
    aac sso describe --profile stage --tenant-id <TENANT_ID>

Replace <TENANT_ID> with the canonical tnt-<lowercase UUIDv4> id.
```

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
- [`aac sso login`](https://docs.cascadeauth.com/cli/reference/aac-sso-login/) — Sign in via your tenant's IdP; caches an AAC session.
