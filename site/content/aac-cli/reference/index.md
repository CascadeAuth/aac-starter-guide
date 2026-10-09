# Command reference

This reference is generated from the `aac` command-line parser: every command, flag, default and exit code below comes from the CLI itself. Each page shows the synopsis, the arguments with their type, default and required state, the output modes, the exit codes and the related commands. `aac <command> --help` prints the synopsis and arguments in the terminal.

The aac platform CLI: guided setup, profiles, tenant administration, single sign-on, trust-anchor inspection and chain audit — headless-first, JSON output by default.

## Synopsis

```text
aac [-h] [--version] <command> [<args>]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--version` | flag | no | — | show program's version number and exit |

## Commands

- [`aac init`](/cli/reference/aac-init/) — Guided setup: register a developer tenant and create a runnable agent.
- [`aac agent`](/cli/reference/aac-agent/) — Inspect and maintain an agent created by `aac init` (status/renew/list).
  - [`aac agent status`](/cli/reference/aac-agent-status/) — Report what exists, certificate expiry, permission problems and the next command.
  - [`aac agent renew`](/cli/reference/aac-agent-renew/) — Replace the short-lived certificates; archive the old material.
  - [`aac agent list`](/cli/reference/aac-agent-list/) — List every agent under the CLI home with its tenant, case and state.
- [`aac profile`](/cli/reference/aac-profile/) — Manage local profiles (list/show/create/update/delete).
  - [`aac profile list`](/cli/reference/aac-profile-list/) — List all profiles (selected/binding/pending state).
  - [`aac profile show`](/cli/reference/aac-profile-show/) — Show one profile: stored vs effective values + sources.
  - [`aac profile create`](/cli/reference/aac-profile-create/) — Create a new named profile.
  - [`aac profile update`](/cli/reference/aac-profile-update/) — Update a profile's endpoints or clear its local tenant binding.
  - [`aac profile delete`](/cli/reference/aac-profile-delete/) — Delete a local profile (never the server-side tenant).
- [`aac tenant`](/cli/reference/aac-tenant/) — Tenant administration.
  - [`aac tenant register`](/cli/reference/aac-tenant-register/) — Register a tenant or resume this profile's pending registration.
  - [`aac tenant list`](/cli/reference/aac-tenant-list/) — List registered tenants visible to your credential (your own tenant, with a session; registration-attribute tier).
  - [`aac tenant describe`](/cli/reference/aac-tenant-describe/) — One tenant's full registration state (API-key METADATA only).
  - [`aac tenant issue-domain-challenge`](/cli/reference/aac-tenant-issue-domain-challenge/) — Issue or rotate the DNS TXT challenge for one tenant business domain.
  - [`aac tenant verify-domain`](/cli/reference/aac-tenant-verify-domain/) — Resolve and verify the current DNS TXT tenant-domain challenge.
  - [`aac tenant release-domain`](/cli/reference/aac-tenant-release-domain/) — Voluntarily release one business-domain claim for planned transfer.
  - [`aac tenant revoke-domain`](/cli/reference/aac-tenant-revoke-domain/) — Terminally revoke one business-domain claim for security or teardown.
  - [`aac tenant update`](/cli/reference/aac-tenant-update/) — Update mutable tenant attributes (sparse: only passed flags change).
  - [`aac tenant api-key`](/cli/reference/aac-tenant-api-key/) — Plan a zero-downtime tenant API-key rotation.
    - [`aac tenant api-key list`](/cli/reference/aac-tenant-api-key-list/) — List the complete at-most-two ACTIVE key metadata set.
    - [`aac tenant api-key issue`](/cli/reference/aac-tenant-api-key-issue/) — Issue and stage a second ACTIVE API key exactly once.
    - [`aac tenant api-key retire`](/cli/reference/aac-tenant-api-key-retire/) — Terminally retire one exact ACTIVE key after client migration.
  - [`aac tenant reissue-api-key`](/cli/reference/aac-tenant-reissue-api-key/) — Replace a lost or suspected-compromised tenant API key.
  - [`aac tenant add-workload`](/cli/reference/aac-tenant-add-workload/) — Add a post-registration workload identity.
  - [`aac tenant list-workloads`](/cli/reference/aac-tenant-list-workloads/) — List this tenant's workload lifecycle records.
  - [`aac tenant describe-workload`](/cli/reference/aac-tenant-describe-workload/) — Describe one workload lifecycle record by opaque id.
  - [`aac tenant update-workload`](/cli/reference/aac-tenant-update-workload/) — Set or clear a workload's display name.
  - [`aac tenant deactivate-workload`](/cli/reference/aac-tenant-deactivate-workload/) — Terminally deactivate a workload.
  - [`aac tenant assign-hosted-domain`](/cli/reference/aac-tenant-assign-hosted-domain/) — Request the AAC-assigned trust domain for your tenant and save it in the bound profile; repeated calls reuse it.
  - [`aac tenant reactivate-hosted-domain`](/cli/reference/aac-tenant-reactivate-hosted-domain/) — Reactivate the tenant's AAC-assigned trust domain after a revocation; the name does not change.
  - [`aac tenant bind-trust-domain`](/cli/reference/aac-tenant-bind-trust-domain/) — Bind a SPIFFE trust domain using current exact-name evidence or ceremony.
  - [`aac tenant list-trust-domains`](/cli/reference/aac-tenant-list-trust-domains/) — List this tenant's trust-domain bindings.
  - [`aac tenant rotate-admin-key`](/cli/reference/aac-tenant-rotate-admin-key/) — Replace this tenant's admin key with a new PUBLIC key.
  - [`aac tenant revoke-trust-domain`](/cli/reference/aac-tenant-revoke-trust-domain/) — Revoke a trust-domain binding episode by binding id.
- [`aac trust-anchor`](/cli/reference/aac-trust-anchor/) — Inspect YOUR tenant's trust-anchor state (keys + ingest ledger).
  - [`aac trust-anchor list`](/cli/reference/aac-trust-anchor-list/) — All your keys — every lifecycle state, both roles.
  - [`aac trust-anchor describe`](/cli/reference/aac-trust-anchor-describe/) — One key: full lifecycle + stored public PEM.
  - [`aac trust-anchor revoke`](/cli/reference/aac-trust-anchor-revoke/) — Terminally revoke one root-signing key (session required).
  - [`aac trust-anchor ingest-history`](/cli/reference/aac-trust-anchor-ingest-history/) — Accepted publishes from the ingest ledger, newest-first.
- [`aac chain`](/cli/reference/aac-chain/) — Discover chains and inspect their audit observations.
  - [`aac chain list`](/cli/reference/aac-chain-list/) — List observed chains visible to your tenant.
  - [`aac chain show`](/cli/reference/aac-chain-show/) — Chronological cross-org timeline (participant tenants only).
- [`aac sso`](/cli/reference/aac-sso/) — Platform single sign-on: IdP connections, login, sessions and recovery keys.
  - [`aac sso describe`](/cli/reference/aac-sso-describe/) — Public SSO login descriptor as JSON; no login needed.
  - [`aac sso register-idp`](/cli/reference/aac-sso-register-idp/) — Register a tenant↔IdP connection.
  - [`aac sso generate-idp-recovery-key`](/cli/reference/aac-sso-generate-idp-recovery-key/) — Generate offline tenant IdP recovery-key artifacts.
  - [`aac sso enroll-idp-recovery-key`](/cli/reference/aac-sso-enroll-idp-recovery-key/) — Enroll a tenant's IdP recovery public verifier.
  - [`aac sso list-idp-recovery-keys`](/cli/reference/aac-sso-list-idp-recovery-keys/) — List IdP recovery-key lifecycle metadata.
  - [`aac sso rotate-idp-recovery-key`](/cli/reference/aac-sso-rotate-idp-recovery-key/) — Replace the ACTIVE IdP recovery public verifier.
  - [`aac sso revoke-idp-recovery-key`](/cli/reference/aac-sso-revoke-idp-recovery-key/) — Terminally revoke the ACTIVE IdP recovery key.
  - [`aac sso request-idp-repair`](/cli/reference/aac-sso-request-idp-repair/) — Sign and submit one exact IdP connection repair request.
  - [`aac sso approve-idp-repair`](/cli/reference/aac-sso-approve-idp-repair/) — AAC Ops approves one exact tenant-signed IdP repair.
  - [`aac sso list-idp`](/cli/reference/aac-sso-list-idp/) — List safe tenant IdP connection handles without authentication.
  - [`aac sso replace-idp`](/cli/reference/aac-sso-replace-idp/) — Replace one tenant IdP connection from a complete file.
  - [`aac sso logout`](/cli/reference/aac-sso-logout/) — Delete the cached AAC session for a tenant.
  - [`aac sso whoami`](/cli/reference/aac-sso-whoami/) — Show cached session identity/expiry and the profile's saved AAC-assigned domain.
  - [`aac sso login`](/cli/reference/aac-sso-login/) — Sign in via your tenant's IdP; caches an AAC session.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | The control plane or the identity provider rejected the request. |
| `2` | Usage error: an invalid flag, value or flag combination. |
| `3` | A local configuration or state problem: profile, credential file, cached session or agent. |
| `4` | Transport failure: an endpoint could not be reached. |
| `130` | Interrupted by the operator (Ctrl-C); a remote change may already have committed. |

## Execution graphs

- [`aeg list`](/aeg/reference/list/)
- [`aeg render`](/aeg/reference/render/)
