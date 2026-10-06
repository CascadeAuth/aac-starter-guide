Canonical: https://docs.cascadeauth.com/cli/reference/aac-agent-renew/

Applies to: AAC CLI 0.2.9

Documentation revision: 030a3c3d5e097f2b3e4634e28861322e192f5604

---

# `aac agent renew`

Replace the short-lived certificates; archive the old material.

In "The CLI creates a development CA" mode, reissues the workload, receipt and HTTPS certificates with new keys; the development CA is reissued only when expired or within one day of expiry, or with --ca, and a new CA needs the publisher to publish the new anchor. In "I bring my own CA certificate" mode nothing is reissued: pass the replacement certificates your issuer produced, each with its key file, and --ca-cert-file if your CA certificate changed too.

## Synopsis

```text
aac agent renew
  [-h]
  --agent AGENT
  [--output {json,table}]
  [--profile PROFILE]
  [--ca]
  [--workload-cert-file PATH]
  [--terminal-cert-file PATH]
  [--tls-cert-file PATH]
  [--ca-cert-file PATH]
  [--workload-key-file PATH]
  [--terminal-key-file PATH]
  [--tls-key-file PATH]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--agent` | value | yes | — | Target agent name under ~/.aac/agents/. |
| `--output` | `json` \| `table` | no | `json` | Output mode (JSON by default). |
| `--profile` | value | no | — | Optional check that the agent belongs to this profile; the agent itself records its profile, so the flag is never required. |
| `--ca` | flag | no | — | Also reissue the development CA now. |

### I bring my own CA certificate

Your own issuer has signed the agent's certificates, and your CA private key never reaches this machine. Certificate source alone does not qualify a production deployment. Pass only what your issuer re-signed: each replacement certificate with its key file, or on its own when the key is unchanged. Add --ca-cert-file only when your CA certificate changed too, and then replace every certificate it did not sign. Your CA's key must be Ed25519 or EC P-256, and it must have signed each certificate with Ed25519 or ECDSA-with-SHA-256. The two identity keys may be Ed25519 or EC P-256; the HTTPS key must be EC P-256. RSA is not supported: the sidecar cannot verify against it.

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `--workload-cert-file` | value | no | — | Use this certificate your issuer signed for the agent's identity. |
| `--terminal-cert-file` | value | no | — | Use this certificate your issuer signed for the agent's receipts. |
| `--tls-cert-file` | value | no | — | Use this certificate your issuer signed for the agent's HTTPS listener. |
| `--ca-cert-file` | value | no | — | Use this existing certificate authority certificate. |
| `--workload-key-file` | value | no | — | Use this existing private key for the agent's identity. |
| `--terminal-key-file` | value | no | — | Use this existing private key for the agent's receipts. |
| `--tls-key-file` | value | no | — | Use this existing private key for the agent's HTTPS listener. |

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

- [`aac agent`](https://docs.cascadeauth.com/cli/reference/aac-agent/)
- [`aac agent status`](https://docs.cascadeauth.com/cli/reference/aac-agent-status/) — Report what exists, certificate expiry, permission problems and the next command.
- [`aac agent list`](https://docs.cascadeauth.com/cli/reference/aac-agent-list/) — List every agent under the CLI home with its tenant, case and state.
