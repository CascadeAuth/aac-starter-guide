# `aeg list`

List roots from local files, a control-plane profile, or both.

## Synopsis

```text
aeg list
  [-h]
  [--events FILE ...]
  [--actions FILE ...]
  [--profile PROFILE]
  [--task-ref TASK_REF]
  [--limit LIMIT]
  [--max-pages MAX_PAGES]
  [--page-token PAGE_TOKEN]
  [--since SINCE | --from FROM_TIME]
  [--to TO_TIME]
  [--output {table,json}]
```

## Arguments

| Option | Required | Default | Description |
|---|---|---|---|
| `-h, --help` | no | `—` | show this help message and exit |
| `--events` | no | `[]` | Sidecar JSONL file; repeat for each agent. |
| `--actions` | no | `[]` | Application action_taken JSONL file; repeat as needed. |
| `--profile` | no | `—` | Query this AAC CLI profile; with files, join by root ID. |
| `--task-ref` | no | `—` | Exact local task reference; requires local files. |
| `--limit` | no | `—` | Central page size, 1..200 (default 50). |
| `--max-pages` | no | `—` | Central fetch bound, 1..20 (default 1). |
| `--page-token` | no | `—` | Continue central enumeration; omit --since. |
| `--since` | no | `—` | Look back, e.g. 24h or 7d; online defaults to 24h, maximum 31d. Local also accepts m. |
| `--from` | no | `—` | Inclusive ISO 8601 observation time with timezone. |
| `--to` | no | `—` | Exclusive ISO 8601 observation time with timezone. |
| `--output` | no | `table` |  |

## Exit codes

- **0:** completed successfully.
- **2:** invalid arguments or evidence, or an unreadable/unwritable local file.
- **4:** the requested central query failed; any recoverable graph or listing remains partial.

[Agent Execution Graphs](/aeg/)
