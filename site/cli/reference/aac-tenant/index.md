Canonical: https://docs.cascadeauth.com/cli/reference/aac-tenant/

Applies to: AAC CLI 0.2.10

Documentation revision: 8ac907aefe6d0ee5890eb6ea197f8b469306f03c

---

# `aac tenant`

Tenant administration.

## Synopsis

```text
aac tenant [-h] <command> [<args>]
```

## Commands

| Command | Description |
|---|---|
| [`aac tenant register`](https://docs.cascadeauth.com/cli/reference/aac-tenant-register/) | Register a tenant or resume this profile's pending registration. |
| [`aac tenant list`](https://docs.cascadeauth.com/cli/reference/aac-tenant-list/) | List registered tenants visible to your credential (your own tenant, with a session; registration-attribute tier). |
| [`aac tenant describe`](https://docs.cascadeauth.com/cli/reference/aac-tenant-describe/) | One tenant's full registration state (API-key METADATA only). |
| [`aac tenant issue-domain-challenge`](https://docs.cascadeauth.com/cli/reference/aac-tenant-issue-domain-challenge/) | Issue or rotate the DNS TXT challenge for one tenant business domain. |
| [`aac tenant verify-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-verify-domain/) | Resolve and verify the current DNS TXT tenant-domain challenge. |
| [`aac tenant release-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-release-domain/) | Voluntarily release one business-domain claim for planned transfer. |
| [`aac tenant revoke-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-revoke-domain/) | Terminally revoke one business-domain claim for security or teardown. |
| [`aac tenant update`](https://docs.cascadeauth.com/cli/reference/aac-tenant-update/) | Update mutable tenant attributes (sparse: only passed flags change). |
| [`aac tenant api-key`](https://docs.cascadeauth.com/cli/reference/aac-tenant-api-key/) | Plan a zero-downtime tenant API-key rotation. |
| [`aac tenant reissue-api-key`](https://docs.cascadeauth.com/cli/reference/aac-tenant-reissue-api-key/) | Replace a lost or suspected-compromised tenant API key. |
| [`aac tenant add-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-add-workload/) | Add a post-registration workload identity. |
| [`aac tenant list-workloads`](https://docs.cascadeauth.com/cli/reference/aac-tenant-list-workloads/) | List this tenant's workload lifecycle records. |
| [`aac tenant describe-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-describe-workload/) | Describe one workload lifecycle record by opaque id. |
| [`aac tenant update-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-update-workload/) | Set or clear a workload's display name. |
| [`aac tenant deactivate-workload`](https://docs.cascadeauth.com/cli/reference/aac-tenant-deactivate-workload/) | Terminally deactivate a workload. |
| [`aac tenant assign-hosted-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-assign-hosted-domain/) | Request the AAC-assigned trust domain for your tenant and save it in the bound profile; repeated calls reuse it. |
| [`aac tenant reactivate-hosted-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-reactivate-hosted-domain/) | Reactivate the tenant's AAC-assigned trust domain after a revocation; the name does not change. |
| [`aac tenant bind-trust-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-bind-trust-domain/) | Bind a SPIFFE trust domain using current exact-name evidence or ceremony. |
| [`aac tenant list-trust-domains`](https://docs.cascadeauth.com/cli/reference/aac-tenant-list-trust-domains/) | List this tenant's trust-domain bindings. |
| [`aac tenant rotate-admin-key`](https://docs.cascadeauth.com/cli/reference/aac-tenant-rotate-admin-key/) | Replace this tenant's admin key with a new PUBLIC key. |
| [`aac tenant revoke-trust-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-revoke-trust-domain/) | Revoke a trust-domain binding episode by binding id. |

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |

## Related commands

- [`aac`](https://docs.cascadeauth.com/cli/reference/)
- [`aac init`](https://docs.cascadeauth.com/cli/reference/aac-init/) — Guided setup: register a developer tenant and create a runnable agent.
- [`aac agent`](https://docs.cascadeauth.com/cli/reference/aac-agent/) — Inspect and maintain an agent created by `aac init` (status/renew/list).
- [`aac profile`](https://docs.cascadeauth.com/cli/reference/aac-profile/) — Manage local profiles (list/show/create/update/delete).
- [`aac trust-anchor`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor/) — Inspect YOUR tenant's trust-anchor state (keys + ingest ledger).
- [`aac chain`](https://docs.cascadeauth.com/cli/reference/aac-chain/) — Discover chains and inspect their audit observations.
- [`aac sso`](https://docs.cascadeauth.com/cli/reference/aac-sso/) — Platform single sign-on: IdP connections, login, sessions and recovery keys.
