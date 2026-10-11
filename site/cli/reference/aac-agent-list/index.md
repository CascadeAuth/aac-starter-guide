Canonical: https://docs.cascadeauth.com/cli/reference/aac-agent-list/

Applies to: AAC CLI 0.2.11

Documentation revision: 5c77b407625370cd7b937cc1a7578edff5f0d0d0

---

# `aac agent list`

List every agent under the CLI home with its tenant, case and state.

List every agent; an unreadable or unsupported record is reported in that agent's state without hiding the other agents. Invalid profile bindings are reported per agent: JSON includes profile_binding_consistent and the repair next_command; table output marks inconsistent bindings.

## Synopsis

```text
aac agent list [-h] [--output {json,table}]
```

## Arguments

| Argument | Type | Required | Default | Description |
|---|---|---|---|---|
| `-h`, `--help` | flag | no | — | show this help message and exit |
| `--output` | `json` \| `table` | no | `json` | Output mode (JSON by default). |

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

## Related commands

- [`aac agent`](https://docs.cascadeauth.com/cli/reference/aac-agent/)
- [`aac agent status`](https://docs.cascadeauth.com/cli/reference/aac-agent-status/) — Report what exists, certificate expiry, permission problems and the next command.
- [`aac agent renew`](https://docs.cascadeauth.com/cli/reference/aac-agent-renew/) — Replace the short-lived certificates; archive the old material.
