Canonical: https://docs.cascadeauth.com/cli/reference/aac-init/

Applies to: AAC CLI 0.2.8

Documentation revision: 6b7d8268ba787d3e9354742259e78153a3a18cae

---

# `aac init`

Guided setup: register a developer tenant and create a runnable agent.

Signs you in, registers a developer tenant (or reuses the profile's tenant), takes the AAC-assigned hosted trust domain, registers your workload, generates DEVELOPMENT keys and certificates, registers the tenant-admin public key together with a new tenant, and writes a complete sidecar configuration plus the publisher and Compose files. Safe to rerun: it resumes or reports the exact conflict and never overwrites private material.

## Synopsis

```text
aac init
  [-h]
  [--profile PROFILE]
  [--admin-url ADMIN_URL]
  [--data-plane-url DATA_PLANE_URL]
  [--trust-url TRUST_URL]
  [--output {json,table}]
  --agent AGENT
  [--workload-path WORKLOAD_PATH]
  [--workload-display-name WORKLOAD_DISPLAY_NAME]
  [--agent-config PATH]
  [--display-name DISPLAY_NAME]
  [--contact CONTACT]
  [--idp {github,google}]
  [--bootstrap-token BOOTSTRAP_TOKEN]
  [--flow {device,pkce}]
  [--no-browser]
  [--create-tenant]
  [--layout {host,container}]
  [--ca-key-file PATH]
  [--workload-cert-file PATH]
  [--terminal-cert-file PATH]
  [--tls-cert-file PATH]
  [--ca-cert-file PATH]
  [--workload-key-file PATH]
  [--terminal-key-file PATH]
  [--tls-key-file PATH]
  [--tenant-admin-key-file PATH]
  [--root-signing-key-file PATH]
  [--pairing-secret-file PATH]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--profile` | value | no | — | Profile to set up under (default: AAC_PROFILE or main). |
| `--admin-url` | value | no | — | Control-plane admin URL; creates the profile if it does not exist. |
| `--data-plane-url` | value | no | — | Control-plane data-plane URL (optional). |
| `--trust-url` | value | no | — | Public trust-material base URL for the sidecar and publisher; required when creating an agent (AAC stage: https://trust.stage.cascadeauth.dev). |
| `--output` | `json` \| `table` | no | `json` | Output mode: json (the default) or table. |
| `--agent` | value | yes | — | Target agent name under ~/.aac/agents/; must match agent_name in the file. |
| `--workload-path` | value | no | — | Optional SPIFFE path check; must match the configuration file or saved identity. |
| `--workload-display-name` | value | no | — | Display name for the workload record (default: \<agent-name\> workload). |
| `--agent-config` | value | no | — | Apply a tenant YAML configuration; required for a new agent. Refresh uses saved values when omitted. |
| `--display-name` | value | no | — | New tenant's display name (required to register). |
| `--contact` | value | no | — | New tenant's contact address (required to register). |
| `--idp` | `github` \| `google` | no | — | Developer-tier self-serve registration and sign-in with this identity provider. |
| `--bootstrap-token` | value | no | — | Ceremony bootstrap token for a control plane that gates registration (local stacks). |
| `--flow` | `device` \| `pkce` | no | — | Override the sign-in flow. |
| `--no-browser` | flag | no | — | Print the sign-in URL instead of opening a browser. |
| `--create-tenant` | flag | no | — | Acknowledge creating a permanent tenant without a prompt (required when stdin is not a terminal). |
| `--layout` | `host` \| `container` | no | — | Path layout for the sidecar configuration: host paths (the default) or the paths inside the containers. Run setup again with another --layout to change it. |

### The CLI creates a development CA

The laptop case. The CLI creates a certificate authority on this machine and signs the agent's identity, receipt and HTTPS certificates with it. No flags are needed. To reuse a development CA across agents, pass `--ca-key-file` and `--ca-cert-file` together; neither one alone. The CA and the two identity keys are Ed25519; the HTTPS key is EC P-256.

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `--ca-key-file` | value | no | — | Use this existing certificate authority key for the CLI to sign with (with --ca-cert-file). |

### I bring my own CA

Your own issuer has signed the agent's certificates, and your CA private key never reaches this machine. Certificate source alone does not qualify a production deployment. All seven together: `--workload-cert-file`, `--terminal-cert-file` and `--tls-cert-file`, each with its key file (`--workload-key-file`, `--terminal-key-file`, `--tls-key-file`), plus `--ca-cert-file`. Never `--ca-key-file`: the CLI does not want your CA key. Your CA's key must be Ed25519 or EC P-256, and it must have signed each certificate with Ed25519 or ECDSA-with-SHA-256. The two identity keys may be Ed25519 or EC P-256; the HTTPS key must be EC P-256. RSA is not supported: the sidecar cannot verify against it.

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `--workload-cert-file` | value | no | — | Use this certificate your issuer signed for the agent's identity. |
| `--terminal-cert-file` | value | no | — | Use this certificate your issuer signed for the agent's receipts. |
| `--tls-cert-file` | value | no | — | Use this certificate your issuer signed for the agent's HTTPS listener. |

### Used by both cases

Pass --ca-cert-file with --ca-key-file to reuse a development CA, or on its own with the three certificates above when your issuer signs.

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `--ca-cert-file` | value | no | — | Use this existing certificate authority certificate. |
| `--workload-key-file` | value | no | — | Use this existing private key for the agent's identity. |
| `--terminal-key-file` | value | no | — | Use this existing private key for the agent's receipts. |
| `--tls-key-file` | value | no | — | Use this existing private key for the agent's HTTPS listener. |

### Other material you can supply

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `--tenant-admin-key-file` | value | no | — | Use this existing tenant-admin signing key. |
| `--root-signing-key-file` | value | no | — | Use this existing root-signing key. |
| `--pairing-secret-file` | value | no | — | Use this existing per-pair invoke-auth secret. |

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

Pass --agent-config to explicitly apply tenant configuration; omit it on a rerun to refresh the last applied values. Restart the sidecar after applying. Sidecar v0.4.0 and later require pairing signatures on /v1/agent/delegations and /v1/agent/mint-root. On older releases, restrict these routes to your authorized originating application at ingress.

## Related commands

- [`aac`](https://docs.cascadeauth.com/cli/reference/)
- [`aac agent`](https://docs.cascadeauth.com/cli/reference/aac-agent/) — Inspect and maintain an agent created by `aac init` (status/renew/list).
- [`aac profile`](https://docs.cascadeauth.com/cli/reference/aac-profile/) — Manage local profiles (list/show/create/update/delete).
- [`aac tenant`](https://docs.cascadeauth.com/cli/reference/aac-tenant/) — Tenant administration.
- [`aac trust-anchor`](https://docs.cascadeauth.com/cli/reference/aac-trust-anchor/) — Inspect YOUR tenant's trust-anchor state (keys + ingest ledger).
- [`aac chain`](https://docs.cascadeauth.com/cli/reference/aac-chain/) — Discover chains and inspect their audit observations.
- [`aac sso`](https://docs.cascadeauth.com/cli/reference/aac-sso/) — Platform single sign-on: IdP connections, login, sessions and recovery keys.
