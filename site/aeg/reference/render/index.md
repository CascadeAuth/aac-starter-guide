Canonical: https://docs.cascadeauth.com/aeg/reference/render/

Applies to: AAC CLI 0.2.10

Documentation revision: 8ac907aefe6d0ee5890eb6ea197f8b469306f03c

---

# `aeg render`

Write a self-contained interactive HTML graph.

## Synopsis

```text
aeg render
  [-h]
  [--events FILE ...]
  [--actions FILE ...]
  [--profile PROFILE | --trace-json FILE]
  [--root-token-id ID | --mint-response FILE]
  --output FILE
```

## Arguments

| Option | Required | Default | Description |
|---|---|---|---|
| `-h, --help` | no | `—` | show this help message and exit |
| `--events` | no | `[]` | Sidecar JSONL file; repeat for each agent. |
| `--actions` | no | `[]` | Application action_taken JSONL file; repeat as needed. |
| `--profile` | no | `—` | Query this existing AAC CLI profile for authorized central metadata. |
| `--trace-json` | no | `—` | Read a saved chain-show JSON export offline. |
| `--root-token-id` | no | `—` |  |
| `--mint-response` | no | `—` |  |
| `--output` | yes | `—` |  |

## Exit codes

- **0:** completed successfully.
- **2:** invalid arguments or evidence, or an unreadable/unwritable local file.
- **4:** the requested central query failed; any recoverable graph or listing remains partial.
- **130:** interrupted by the operator (Ctrl-C).

[Agent Execution Graphs](https://docs.cascadeauth.com/aeg/)
