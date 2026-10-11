Canonical: https://docs.cascadeauth.com/cli/reference/aac-tenant-rotate-admin-key/

Applies to: AAC CLI 0.2.11

Documentation revision: 5c77b407625370cd7b937cc1a7578edff5f0d0d0

---

# `aac tenant rotate-admin-key`

Replace this tenant's admin key with a new PUBLIC key.

## Synopsis

```text
aac tenant rotate-admin-key
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
  --tenant-admin-pubkey-file TENANT_ADMIN_PUBKEY_FILE
  [--tenant-id TENANT_ID]
  [--bootstrap-token BOOTSTRAP_TOKEN]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to run under (selection: --profile \> AAC_PROFILE \> reserved baseline `main`). `aac profile list` shows what exists. |
| `--admin-url` | value | no | — | Admin-surface base URL (overrides profile). |
| `--data-plane-url` | value | no | — | Data-plane-surface base URL (overrides profile). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--tenant-admin-pubkey-file` | value | yes | — | Path to the PEM-encoded Ed25519 PUBLIC key that becomes the new ACTIVE tenant-admin key. |
| `--tenant-id` | value | no | — | Tenant to rotate (defaults to the profile/AAC_TENANT_ID identity). |
| `--bootstrap-token` | value | no | — | Ceremony bootstrap token (onboarding windows) — lets the ceremony operator rotate on the tenant's behalf while no session exists. Falls back to $AAC_BOOTSTRAP_TOKEN; without one the cached session rides. |

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

## Notes

Accepts and transmits the PUBLIC half only. It never generates or writes private-key material, and if you hand it a private key by mistake it refuses without transmitting or logging it — but it does READ the file you name, because refusing requires inspecting it. Replacement is IMMEDIATE and forward-only: the previous key stops verifying ingest JWSs at once (no grace window) and can never be reinstated. A trust anchor publisher holding the old private key must be given the new one and RESTARTED — it loads its key once at startup. Generate a keypair with: openssl genpkey -algorithm ed25519 -out tenant-admin.pem && openssl pkey -in tenant-admin.pem -pubout -out tenant-admin.public.pem

## Related commands

- [`aac tenant`](https://docs.cascadeauth.com/cli/reference/aac-tenant/)
- [`aac tenant register`](https://docs.cascadeauth.com/cli/reference/aac-tenant-register/) — Register a tenant or resume this profile's pending registration.
- [`aac tenant list`](https://docs.cascadeauth.com/cli/reference/aac-tenant-list/) — List registered tenants visible to your credential (your own tenant, with a session; registration-attribute tier).
- [`aac tenant describe`](https://docs.cascadeauth.com/cli/reference/aac-tenant-describe/) — One tenant's full registration state (API-key METADATA only).
- [`aac tenant issue-domain-challenge`](https://docs.cascadeauth.com/cli/reference/aac-tenant-issue-domain-challenge/) — Issue or rotate the DNS TXT challenge for one tenant business domain.
- [`aac tenant verify-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-verify-domain/) — Resolve and verify the current DNS TXT tenant-domain challenge.
- [`aac tenant release-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-release-domain/) — Voluntarily release one business-domain claim for planned transfer.
- [`aac tenant revoke-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-revoke-domain/) — Terminally revoke one business-domain claim for security or teardown.
- [`aac tenant update`](https://docs.cascadeauth.com/cli/reference/aac-tenant-update/) — Update mutable tenant attributes (sparse: only passed flags change).
- [`aac tenant api-key`](https://docs.cascadeauth.com/cli/reference/aac-tenant-api-key/) — Plan a zero-downtime tenant API-key rotation.
- [`aac tenant reissue-api-key`](https://docs.cascadeauth.com/cli/reference/aac-tenant-reissue-api-key/) — Replace a lost or suspected-compromised tenant API key.
- [`aac tenant add-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-add-workload/) — Add a post-registration workload identity.
- [`aac tenant list-workloads`](https://docs.cascadeauth.com/cli/reference/aac-tenant-list-workloads/) — List this tenant's workload lifecycle records.
- [`aac tenant describe-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-describe-workload/) — Describe one workload lifecycle record by opaque id.
- [`aac tenant update-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-update-workload/) — Set or clear a workload's display name.
- [`aac tenant deactivate-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-deactivate-workload/) — Terminally deactivate a workload.
- [`aac tenant assign-hosted-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-assign-hosted-domain/) — Request the AAC-assigned trust domain for your tenant and save it in the bound profile; repeated calls reuse it.
- [`aac tenant reactivate-hosted-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-reactivate-hosted-domain/) — Reactivate the tenant's AAC-assigned trust domain after a revocation; the name does not change.
- [`aac tenant bind-trust-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-bind-trust-domain/) — Bind a SPIFFE trust domain using current exact-name evidence or ceremony.
- [`aac tenant list-trust-domains`](https://docs.cascadeauth.com/cli/reference/aac-tenant-list-trust-domains/) — List this tenant's trust-domain bindings.
- [`aac tenant revoke-trust-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-revoke-trust-domain/) — Revoke a trust-domain binding episode by binding id.
