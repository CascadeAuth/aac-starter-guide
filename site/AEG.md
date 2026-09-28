# Agent Execution Graph

This guide describes the `aeg` command supplied by `aac-cli`.

`aeg` reconstructs observed authority and application activity from local
sidecar logs, application records and authorized central trace metadata. It
writes an interactive HTML file; no server is needed to view it. Records and
output stay on the operator's machine. The renderer never uploads local files.

## Install and select a profile

Requires Python 3.11 or later. Install in a Python virtual environment, or use
pipx to keep one dedicated CLI environment:

```sh
python -m pip install --upgrade aac-cli
# Alternatively:
pipx install aac-cli
# For subsequent pipx upgrades:
pipx upgrade aac-cli
```

The one package supplies both `aac` and `aeg`. Check `aac --version` and
`aeg --version` after upgrading. The graph command's version identifies its CLI
release and renderer source identity; there is no separate renderer upgrade.

Use `command -v aac` and `command -v aeg` to check that both commands resolve
to the selected virtual environment or pipx installation. Their version output
must identify the same owning CLI release.

For online listing or rendering, pass `--profile PROFILE` to `aeg`. It uses the same
installed CLI's `chain list` or `chain show` command and your selected profile's tenant
API key. This is the trace API key, not the browser/SSO administration session.
There is no second credential store. Installation does not create a tenant or
its credentials; configure the CLI profile first. Offline rendering and local
listing need no login and ignore any ambient profile unless `--profile` is
explicitly supplied. Local inputs are never uploaded.

## Find an execution and render it

Sidecars write their configured local telemetry sink. In the CLI-generated
Compose layout, `aac agent status --agent NAME` identifies the agent directory;
`compose.env` names `AAC_AGENT_STATE_DIR`. The file is normally
`<agent-directory>/state/telemetry.jsonl` on the setup host, mounted at
`/var/lib/aac/telemetry.jsonl`. A path on that host is not automatically available
on another laptop. Use a retained file sink and explicitly obtain any partner
files you are authorized to hold.

```sh
aeg list --events ./planner-telemetry.jsonl \
  --actions ./planner-actions.jsonl --since 24h --output table

aeg render --mint-response ./start-response.json \
  --events ./planner-telemetry.jsonl --events ./booking-telemetry.jsonl \
  --actions ./planner-actions.jsonl --actions ./booking-actions.jsonl \
  --output ./graphs/reservation.html
```

Use `--root-token-id ID` instead of `--mint-response FILE` for a root returned
by local list. Both selectors are mutually exclusive. With exactly one root in
supplied evidence, the selector may be omitted and the chosen root is printed.
Ambiguous inputs require a selector; the tool never picks the latest run. Each
attempt keeps its own root, even when several attempts concern the same order.
Only actual composite links join independent roots.

Add `--profile PROFILE` to query permitted central metadata in the same render
command. Alternatively, `--trace-json FILE` reads an earlier `aac chain show
--output json` export offline. These source options are mutually exclusive.
A selector or profile does not identify the tenant of local files. Repeat
`--events` and `--actions` for ordinary distinct files from multiple agents.

## List local and central observations

The supplied sources select the mode; there is no mode flag or implicit query
from an ambient profile.

| Sources | Mode | Result |
|---|---|---|
| `--events` and/or `--actions` | local | Read the supplied files without a network request. |
| `--profile` | control-plane | List the calling tenant's participant-visible roots without reading evidence files. |
| Profile and files | hybrid | Join contributed observations by root token ID, once per root. |

Supplying neither source is a usage error. Any listed root can be passed to
`aeg render --root-token-id ID` with the desired profile and/or files.

```sh
aeg list --profile planner --since 7d --output table

aeg list --profile planner --events ./planner-telemetry.jsonl \
  --actions ./planner-actions.jsonl --task-ref attempt-1 \
  --from 2026-09-14T00:00:00Z --to 2026-09-21T00:00:00Z \
  --limit 50 --max-pages 3 --output json

aeg render --profile planner --root-token-id ROOT_ID --output ./graphs/selected.html
```

`--task-ref` is an exact local match. It requires files: the control plane never
stores task references or private business labels. In hybrid mode it selects
locally matched roots with activity in the window and enriches them with fetched
central rows. It cannot select a central-only root by a label AAC does not hold.
Actions without a sidecar token-to-root mapping remain diagnostics; no per-action
network lookup or join by purchase-order label or timestamp is attempted.

With a profile, the default window is the previous 24 hours. `--since` accepts
positive integer hours or days, up to 31 days. Alternatively, supply both
`--from TIME --to TIME`, at most 31 days apart. Timezone-qualified timestamps
are normalized to one UTC half-open interval `[from,to)` shared by local
selection and every central page. `--since` and `--from` are mutually exclusive.
Older local mappings/task references remain available for correlation. Local-only
listing retains its existing unbounded default, optional open-ended `--from` or
`--to`, and minute lookbacks such as `--since 30m`.

Central enumeration fetches one page by default. `--limit` sets its size
(1–200, default 50); `--max-pages` bounds a call (1–20, default 1). These flags
and `--page-token` require a profile. If more pages remain, repeat the same
profile/files/task filter with `--page-token TOKEN`, omitting `--since`.
The server recovers the original interval/page size from the token; any explicit
interval/limit must match. A continuation invocation reports the rows contributed
to that invocation, so local rows may reappear. A central match on an earlier or
unfetched page does not contribute to this invocation's source column.

The `sources` column is `local`, `control-plane` or `both`. **Local means no
central row contributed to this query**, not that AAC never received the chain.
Central observations may always be incomplete: forwarding is best-effort and
pagination is live. Late events and visibility changes can alter repeat queries;
roots that arrive before an already-consumed page boundary can be missed. Repeat
the original window to refresh. Tokens expire 15 minutes after enumeration starts.

JSON retains `chains` and `diagnostics`. Online output adds `schema_version: 1`,
`mode`, resolved `from`/`to`, and `central` fetch coverage: `status` (`more`,
`exhausted` or `failed`), `pages_fetched`, `limit`, `has_more`, `next_page_token`,
`pagination: live` and `evidence: best_effort`. `exhausted` only means the query
has no next page, not complete execution evidence. On failure, `has_more` is the
last successful page's indication (null before any success), and the token
identifies the page to retry when available.

Rows include root ID, local task references, earliest/latest observed times and
contributing sources. Central rows also carry `central_observations`, preserving
the participant IDs, categories, outcomes, observed token count and maximum hop
from the public `aac chain list` JSON v1 contract (first released in CLI 0.2.5).
Those summaries cover retained central evidence, including times outside the
selection window; local times cover selected observations. Joined times span
both contributions. They are not guaranteed start/completion or execution totals.

If a page fails or is incompatible, already fetched central rows and recoverable
local rows remain visible, with diagnostics and exit 4. An unsuccessful bare
continuation cannot recover its interval, so local rows are withheld rather than
filtered against a guessed window. Retry the original interval. No API error,
empty page or missing file establishes another tenant's chain absence.

## Read the graph

Double-click nodes and edges for details. Token details retain all supplied
business actions, including intermediate actions, source locations, receipt
verdicts and available full terminal responses. Application reports are not
verified business truth. Receipt verdicts are the sidecar's recorded observations;
this tool does not verify signatures again. A `verified` verdict alone does not
supply a reservation ID, amount, payment status or full receipt.

Partial graphs are normal. Missing ancestors appear as **not observed** references
only where explicit IDs establish them. The graph does not invent intermediate
edges, actors, amounts or outcomes. Receiver reporting identity is distinct from
token creator identity. Conflicting fields show **sources disagree**, with the
value left uncertain. Sparse central metadata cannot erase richer local records.
No exactly-once count is implied by the number of records; these formats have no
universal unique event identifier.

Central telemetry deliberately omits business payloads, authority caps, exact
caveat expiry and full receipts. Missing/delayed events from best-effort forwarding
are a separate limitation. A failed query is reported explicitly; any recoverable
local HTML remains marked partial and the command exits 4. An opaque 404 is not
proof of another tenant's chain's existence or nonexistence. Local `success`
events do not prove completion of the business task.

Amounts are shown as raw/grouped numeric values. Currency and unit context must
come from supplied records; the renderer does not assume USD. Registered business
labels such as `originator_reference` are distinguished from sidecar-enforced
amount/time constraints. The renderer itself enforces no authorization policy.

## Application record contract

The versioned [action-taken-v1 JSON Schema](https://cascadeauth.github.io/aac-starter-guide/action-taken-v1.json)
is also installed as `aac_cli/_aeg/data/action-taken-v1.json`. Any standard JSON Schema
2020-12 validator can check it. `render` and `list` validate while reading and
report the source file and line. A separate `validate` command is not supplied.

Write one UTF-8 JSON object per line with exactly these eight fields:

```json
{"timestamp_unix_seconds":1789992000,"event_type":"action_taken","tenant_id":"tnt-11111111-1111-4111-8111-111111111111","tenant_short":"Example tenant","token_id":"bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb","actor_spiffe_id":"spiffe://tenant.example/booking","action_summary":"Synthetic unpaid reservation created","action_payload":{"task_ref":"attempt-1","reservation_id":"synthetic-attempt-1","amount":8000,"currency":"USD","payment_status":"unpaid"}}
```

`tenant_id` is the canonical registered `tnt-<UUIDv4>` identity. `tenant_short`
is a display label, never identity or authority. Obtain `token_id` from the
verified invocation context, not an untrusted business payload. The workload's
SPIFFE ID supplies `actor_spiffe_id`. Use the action's wall-clock epoch seconds.
`action_payload.task_ref` is required; other payload fields are tenant-defined.
Convergence records use the triggering arrival's token and a labeled `branches`
map of branch token references. Do not add a ninth required root field. The
sidecar record provides root mapping.

Language-neutral producer steps: construct the eight-field object after the
business decision; encode it with the language's JSON encoder; append the encoded
object and one newline to the application's own retained file. Standard-library
Python writing example (no AAC SDK dependency):

```python
import json
with open("business-actions.jsonl", "a", encoding="utf-8") as stream:
    stream.write(json.dumps(record, ensure_ascii=False, allow_nan=False) + "\n")
```

Emit forwarded/refused/settled business decisions; do not turn a protocol failure
or an `await` hold into completed work. Existing log systems can export this same
format. A filename is a convention and does not establish tenant identity.

## Troubleshooting

- **Cannot select one root:** use local `list`, then pass the intended
  `--root-token-id` or its saved `--mint-response`. A task label alone cannot
  join independent attempts.
- **No reconstructable observations:** check the supplied files and selected
  root. Obtain the relevant retained telemetry from authorized participants;
  a root ID alone is not evidence.
- **Central query failed:** check the explicitly selected profile and its tenant
  API-key configuration with `aac profile show`. Do not share or paste the key.
  A denied or unavailable trace does not prove another tenant's chain exists.
  Any recoverable local graph remains partial and exit status is 4.
- **Output would overwrite evidence:** choose another output filename. Keep
  source logs and exports available for later investigation.
- **A field says not observed or sources disagree:** inspect the source entries
  in the graph. Missing records are not success or failure, and a conflicting
  value cannot be resolved by choosing the last file supplied.

## Boundaries

Designed for tens of displayed nodes in a presentation, roughly 100–200 for
investigation with pan/zoom; this is planning guidance, not a certified cap.
Ordinary repeated attempts in current files are supported. Rotated/copied-file
qualification, detailed competing-source presentation and standalone validation
are separate future work. No remote log collector or central business-data search
is included. Self-contained HTML retains the embedded dependency license notices.

Exit codes: 0 means the requested operation completed within its fetch bound, 2 means input,
selection or output failure, and 4 means a central query failed but a partial
local graph or listing was produced. These codes are not business outcomes.

Choose `--output` explicitly when rendering. The command refuses an output path
that would overwrite one of its evidence inputs.
