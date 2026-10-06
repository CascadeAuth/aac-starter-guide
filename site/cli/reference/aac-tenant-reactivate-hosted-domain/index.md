Canonical: https://docs.cascadeauth.com/cli/reference/aac-tenant-reactivate-hosted-domain/

Applies to: AAC CLI 0.2.9

Documentation revision: 030a3c3d5e097f2b3e4634e28861322e192f5604

---

# `aac tenant reactivate-hosted-domain`

Reactivate the tenant's AAC-assigned trust domain after a revocation; the name does not change.

## Synopsis

```text
aac tenant reactivate-hosted-domain
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--output {json,table}]
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
| `--tenant-id` | value | no | — | Tenant (defaults to the selected profile). |
| `--bootstrap-token` | value | no | — | Explicit platform ceremony; otherwise use the tenant-admin session. |

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
What this command does

  Reactivates your tenant's existing AAC-assigned trust domain after a
  revocation, when self-service reactivation is allowed or under the
  platform ceremony. On an active binding it changes nothing. It never
  allocates a new name, and it is not for a domain you own. The name is
  your tenant id plus a suffix the control plane selects for its
  environment. Use the name the command returns rather than building
  it yourself:

      on stage       <tenant_id>.tenants.stage.cascadeauth.dev
      on production  <tenant_id>.tenants.cascadeauth.com

Where the domain is saved

  On success it is written into the selected profile as hosted_trust_domain,
  if that profile is bound to this tenant; a profile bound to another tenant
  is left unchanged. Signing in with `aac sso login` does not write it, so a
  profile bound that way has no such line until this command,
  `aac tenant assign-hosted-domain` or `aac init` runs. Replace main with
  your profile name:

      aac tenant reactivate-hosted-domain --profile main
      aac profile show main

To use a custom domain you own instead

  Prove control of it with a DNS TXT record, then bind it. A domain you
  own is recorded on the server and never written to the profile:

      aac tenant issue-domain-challenge --profile main --domain example.com
      aac tenant verify-domain --profile main --domain example.com
      aac tenant bind-trust-domain --profile main --trust-domain example.com
```

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
- [`aac tenant bind-trust-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-bind-trust-domain/) — Bind a SPIFFE trust domain using current exact-name evidence or ceremony.
- [`aac tenant list-trust-domains`](https://docs.cascadeauth.com/cli/reference/aac-tenant-list-trust-domains/) — List this tenant's trust-domain bindings.
- [`aac tenant rotate-admin-key`](https://docs.cascadeauth.com/cli/reference/aac-tenant-rotate-admin-key/) — Replace this tenant's admin key with a new PUBLIC key.
- [`aac tenant revoke-trust-domain`](https://docs.cascadeauth.com/cli/reference/aac-tenant-revoke-trust-domain/) — Revoke a trust-domain binding episode by binding id.
