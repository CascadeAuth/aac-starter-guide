Canonical: https://docs.cascadeauth.com/cli/reference/aac-agent-status/

Applies to: AAC CLI 0.2.10

Documentation revision: 8ac907aefe6d0ee5890eb6ea197f8b469306f03c

---

# `aac agent status`

Report what exists, certificate expiry, permission problems and the next command.

## Synopsis

```text
aac agent status
  [-h]
  --agent AGENT
  [--field {tenant-id,hosted-trust-domain,workload-spiffe-id} | --output {json,table}]
  [--profile PROFILE]
  [--remote]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--agent` | value | yes | — | Target agent name under ~/.aac/agents/. |
| `--field` | `tenant-id` \| `hosted-trust-domain` \| `workload-spiffe-id` | no | — | Print one local identity value; fail if unavailable or the agent needs attention. Cannot combine with --output or --remote. |
| `--output` | `json` \| `table` | no | `json` | Output mode (JSON by default). |
| `--profile` | value | no | — | Optional check that the agent belongs to this profile; the agent itself records its profile, so the flag is never required. |
| `--remote` | flag | no | — | Also check that the tenant's public trust material is visible at the trust URL. |

At most one of `--field`, `--output` may be given.

## Output

`--output json` (the default) prints one JSON document to standard output; `--output table` prints a readable table instead. Progress notes and diagnostics go to standard error, so the JSON stays parseable.

`--field` prints one unquoted value followed by a newline instead. It cannot be combined with an explicit `--output`. A missing or invalid value fails without scalar output; diagnostics go to standard error.

## Exit codes

| Code | Meaning |
|---|---|
| `0` | Success. |
| `1` | The control plane or the identity provider rejected the request. |
| `2` | Usage error: an invalid flag, value or flag combination. |
| `3` | A local configuration or state problem: profile, credential file, cached session or agent. |
| `4` | Transport failure: an endpoint could not be reached. |
| `130` | Interrupted by the operator (Ctrl-C); a remote change may already have committed. |

## Related commands

- [`aac agent`](https://docs.cascadeauth.com/cli/reference/aac-agent/)
- [`aac agent renew`](https://docs.cascadeauth.com/cli/reference/aac-agent-renew/) — Replace the short-lived certificates; archive the old material.
- [`aac agent list`](https://docs.cascadeauth.com/cli/reference/aac-agent-list/) — List every agent under the CLI home with its tenant, case and state.
