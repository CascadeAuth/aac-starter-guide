# Agent Execution Graphs (AEG)

This guide describes the `aeg` command supplied by `aac-cli`.

`aeg` reconstructs observed authority and application activity from local
sidecar telemetry, application action records and authorized control-plane trace data. It
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

## Choose the data sources for your graph

AEG can combine three kinds of data:

- **Sidecar telemetry:** local execution records written by the sidecars, such
  as delegation, receive and response events, available authority constraints
  and recorded receipt-verification results.
- **Control-plane trace data via API:** execution observations forwarded to AAC
  and returned through the calling tenant's authorized trace API. These are
  not the control plane's infrastructure/server logs. They can cover participants
  whose local files you do not have, within your tenant's permitted visibility.
- **Application action records:** structured reports of what the agent
  applications did, with business context such as an order, amount or result.

The six combo numbers below are labels, **not a ranking from least to most
information**. Control-plane data can add execution coverage; application
records add business detail. Neither substitutes for the other. All three offer
the most potential context, but duplicate or missing observations may add nothing.

The **aac command(s)** column links to complete examples so the table stays
readable. The `aac-cli` package installs the `aac` and `aeg` executables.
`aeg list` and `aeg render` are the graph commands; `aac chain show` can export a trace.

**Table 1. Data-source combinations and their contributions to Agent Execution Graphs**

| Combo No. | Data Source | What it adds to AEG | aac command(s) |
|---|---|---|---|
| 1 | Sidecar telemetry | Local protocol detail, authority constraints and recorded outcomes from the supplied sidecars. Coverage is limited to the records you supply. | [List and render](#combo-1-sidecar-telemetry-list-and-render) |
| 2 | Sidecar telemetry + control-plane trace data via API | Local detail plus authorized observations from AAC; these can fill gaps in execution coverage when some local files are unavailable. | [List and render](#combo-2-sidecar-telemetry-control-plane-trace-data-list-and-render) |
| 3 | Sidecar telemetry + application action records | Links application-reported business actions and results to the authority graph reconstructed from local sidecar records. | [List and render](#combo-3-sidecar-telemetry-application-action-records-list-and-render) |
| 4 | Sidecar telemetry + control-plane trace data via API + application action records | Combines local protocol detail, authorized control-plane coverage and application-reported business context. | [List and render](#combo-4-sidecar-telemetry-control-plane-trace-data-application-action-records-list-and-render) |
| 5 | Control-plane trace data via API + application action records | Adds local business reports to the graph reconstructed from the control-plane trace, when its token-to-root mapping can connect those reports. Private authority details omitted by the API stay unavailable. | [Discover, then render](#combo-5-control-plane-trace-data-application-action-records-discover-then-render) |
| 6 | Control-plane trace data via API | Reconstructs the available authorized execution observations without local input files. It omits private business payloads, authority caps, exact expiry and full receipts. | [List and render](#combo-6-control-plane-trace-data-list-and-render) |

**Application action records** are structured application log entries that
conform to AAC's [Application record contract](#application-record-contract).
They are `action_taken` JSONL records, not arbitrary application log text.
Application records alone cannot reconstruct the authority graph.

## Commands for each combination

### Identify your inputs and choose an execution

`./evidence/sidecar.jsonl` is an illustrative path to an **existing structured
sidecar telemetry log**. It is not created by either command below and is not
an arbitrary container console/access log. Replace it with your actual
telemetry file. In a CLI-generated layout this is usually
`<agent-directory>/state/telemetry.jsonl` on the setup host;
`aac agent status --agent NAME` identifies that directory.

`./evidence/actions.jsonl` is likewise an existing file of application-emitted
`action_taken` records. Replace it with your application's actual file.
The examples do not create an `./evidence` directory or collect/copy these
inputs for you. Repeat `--events` or `--actions` when you have several files.

`tenant-a` is an already configured AAC CLI profile with a tenant API key
permitted to read the execution. The profile controls API access; it does not
grant access to another tenant's local files or identify who owns files you supply.

**Listing is optional discovery.** In every listing example,
`--output table` means “print a table to standard output,” normally your
terminal screen. No table file is saved unless you redirect the output yourself.
Choose the intended execution and copy its complete value from the
**ROOT TOKEN ID** column. Do not confuse it with a task reference, order number
or an individual hop's token ID.

**Rendering is a separate operation.** In each render block below, replace
`REPLACE_WITH_ROOT_TOKEN_ID` with that chosen ID, keeping the quotes.
The shell variable `$ROOT_ID` passes this value to `--root-token-id`.
The renderer rereads the specified files and, when `--profile` is supplied,
fetches the selected root's detailed trace itself. It does not read the printed
table or an implicit file/cache left by `aeg list`.

**You do not have to run the two commands in sequence.** If you already have
the root ID from a previous listing or a successful chain-start response,
run the render block directly. You can also replace `--root-token-id "$ROOT_ID"`
with `--mint-response ./start-response.json` when you have a saved successful
start response. Use one selector, not both. With exactly one root in supplied
files or a saved trace, the renderer can infer the root; ambiguous inputs are
refused. A profile alone is not a root selector.

The two commands use `--output` differently: `aeg list --output table`
chooses a display **format**, while `aeg render --output ./graphs/example.html`
chooses a destination **file**. The renderer creates missing output directories.
Paths beginning with `./` are relative to the directory where you run the
command. Open the resulting HTML in a browser; use a new output filename to
retain an earlier graph.

Listing filters such as `--since`, `--limit` and `--max-pages` apply only
to discovery. They do not carry forward into rendering. The renderer builds
the selected execution from the available input records and fetched trace,
which may contain observations outside the listing's discovery interval.
A successful hybrid listing therefore does not establish a successful hybrid render.

Saving a listing as table text or JSON does not turn it into render input.
`--trace-json` expects a detailed `aac chain show` export, as described
[below](#use-a-saved-control-plane-trace-instead-of-a-live-api-query).

### Combo 1: sidecar telemetry, list and render

**Inputs:** an existing sidecar telemetry file. No API access or application action file is used.

**Optional discovery — print candidate executions to your terminal:**

```sh
aeg list --events ./evidence/sidecar.jsonl --output table
```

No listing file is written. Copy the chosen row's **ROOT TOKEN ID** into the
quoted assignment below. If you already know that ID, skip discovery and run
this render block alone.

**Render — read the sources and write the HTML graph:**

```sh
ROOT_ID='REPLACE_WITH_ROOT_TOKEN_ID'
aeg render --events ./evidence/sidecar.jsonl \
  --root-token-id "$ROOT_ID" --output ./graphs/combo-1.html
```

**Output file:** `./graphs/combo-1.html` — the `graphs` subdirectory of your current working directory.
The renderer reads the sidecar telemetry directly. Additional sidecar files can add missing participants or hops. A recorded protocol success alone does not establish completion of the business task.

### Combo 2: sidecar telemetry + control-plane trace data, list and render

**Inputs:** an existing sidecar telemetry file and the API access configured in `tenant-a`.

**Optional discovery — print candidate executions to your terminal:**

```sh
aeg list --profile tenant-a --events ./evidence/sidecar.jsonl \
  --since 24h --limit 50 --max-pages 3 --output table
```

No listing file is written. Copy the chosen row's **ROOT TOKEN ID** into the
quoted assignment below. If you already know that ID, skip discovery and run
this render block alone.

**Render — read the sources and write the HTML graph:**

```sh
ROOT_ID='REPLACE_WITH_ROOT_TOKEN_ID'
aeg render --profile tenant-a --events ./evidence/sidecar.jsonl \
  --root-token-id "$ROOT_ID" --output ./graphs/combo-2.html
```

**Output file:** `./graphs/combo-2.html` — the `graphs` subdirectory of your current working directory.
The renderer rereads the sidecar file and requests the selected root's detailed API trace. It preserves richer local fields when the trace omits them. Forwarding, retention and permissions can leave gaps; successful retrieval is not a completeness guarantee.

### Combo 3: sidecar telemetry + application action records, list and render

**Inputs:** an existing sidecar telemetry file and a conforming application action-record file. The sidecar observations provide the token-to-root mappings used to attach the application records.

**Optional discovery — print candidate executions to your terminal:**

```sh
aeg list --events ./evidence/sidecar.jsonl \
  --actions ./evidence/actions.jsonl --output table
```

No listing file is written. Copy the chosen row's **ROOT TOKEN ID** into the
quoted assignment below. If you already know that ID, skip discovery and run
this render block alone.

**Render — read the sources and write the HTML graph:**

```sh
ROOT_ID='REPLACE_WITH_ROOT_TOKEN_ID'
aeg render --events ./evidence/sidecar.jsonl \
  --actions ./evidence/actions.jsonl \
  --root-token-id "$ROOT_ID" --output ./graphs/combo-3.html
```

**Output file:** `./graphs/combo-3.html` — the `graphs` subdirectory of your current working directory.
The renderer reads both files itself and adds application-reported actions for tokens it can match. This is offline, even when an ambient profile is set. Application reports are not independently verified business truth.

### Combo 4: sidecar telemetry + control-plane trace data + application action records, list and render

**Inputs:** the two existing local files and the API access configured in `tenant-a`.

**Optional discovery — print candidate executions to your terminal:**

```sh
aeg list --profile tenant-a --events ./evidence/sidecar.jsonl \
  --actions ./evidence/actions.jsonl \
  --since 24h --limit 50 --max-pages 3 --output table
```

No listing file is written. Copy the chosen row's **ROOT TOKEN ID** into the
quoted assignment below. If you already know that ID, skip discovery and run
this render block alone.

**Render — read the sources and write the HTML graph:**

```sh
ROOT_ID='REPLACE_WITH_ROOT_TOKEN_ID'
aeg render --profile tenant-a --events ./evidence/sidecar.jsonl \
  --actions ./evidence/actions.jsonl \
  --root-token-id "$ROOT_ID" --output ./graphs/combo-4.html
```

**Output file:** `./graphs/combo-4.html` — the `graphs` subdirectory of your current working directory.
The renderer rereads both files and independently fetches the selected root's detailed trace. Inspect which sources contributed and any gaps or conflicts. Using all three inputs does not automatically make the graph complete, and local files are not uploaded.

### Combo 5: control-plane trace data + application action records, discover then render

**Inputs:** an existing conforming application action-record file and the API access configured in `tenant-a`. A local sidecar file is not required. “Discover then render” describes the route when you do not know the root ID; discovery is optional when you already have it.

**Optional discovery — print candidate executions to your terminal:**

```sh
aeg list --profile tenant-a --since 24h \
  --limit 50 --max-pages 3 --output table
```

No listing file is written. Copy the chosen row's **ROOT TOKEN ID** into the
quoted assignment below. If you already know that ID, skip discovery and run
this render block alone.

**Render — read the sources and write the HTML graph:**

```sh
ROOT_ID='REPLACE_WITH_ROOT_TOKEN_ID'
aeg render --profile tenant-a --actions ./evidence/actions.jsonl \
  --root-token-id "$ROOT_ID" --output ./graphs/combo-5.html
```

**Output file:** `./graphs/combo-5.html` — the `graphs` subdirectory of your current working directory.
The selected ID is the only information you carry from discovery to rendering. The listing does not produce a trace file. During rendering, the API is queried again for that root's detailed trace; its token-to-root mappings connect matching application records.

A control-plane listing contains root summaries, not per-token mappings, so the listing above does not read the action file. Unmatched action records are reported as diagnostics during rendering; the renderer does not join by order labels, timestamps or guessed identities. An amount reported by an application does not reveal an authority cap omitted by the API.

### Combo 6: control-plane trace data, list and render

**Inputs:** the API access configured in `tenant-a`. No local telemetry or application action files are required.

**Optional discovery — print candidate executions to your terminal:**

```sh
aeg list --profile tenant-a --since 24h \
  --limit 50 --max-pages 3 --output table
```

No listing file is written. Copy the chosen row's **ROOT TOKEN ID** into the
quoted assignment below. If you already know that ID, skip discovery and run
this render block alone.

**Render — read the sources and write the HTML graph:**

```sh
ROOT_ID='REPLACE_WITH_ROOT_TOKEN_ID'
aeg render --profile tenant-a --root-token-id "$ROOT_ID" \
  --output ./graphs/combo-6.html
```

**Output file:** `./graphs/combo-6.html` — the `graphs` subdirectory of your current working directory.
The renderer fetches the selected root's detailed trace directly; it does not consume the earlier listing. It cannot recover private application records, full receipts or authority fields AAC does not retain. An empty or failed response does not establish that another tenant's execution did not happen.

### Use a saved control-plane trace instead of a live API query

A saved trace is another way to supply the same data origin, not a seventh
source combination. Export the selected root once, then render it offline:

```sh
mkdir -p ./evidence
ROOT_ID='REPLACE_WITH_ROOT_TOKEN_ID'
aac chain show --profile tenant-a --token-id "$ROOT_ID" --output json \
  > ./evidence/trace.json

aeg render --trace-json ./evidence/trace.json --root-token-id "$ROOT_ID" \
  --output ./graphs/saved-trace.html
```

Add the corresponding `--events` and/or `--actions` inputs for combinations
2, 4 or 5. `--trace-json` and `--profile` are mutually exclusive for rendering.
A saved export is a snapshot; opening or rendering it offline does not fetch
new observations from AAC.

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

ROOT_ID='REPLACE_WITH_ROOT_TOKEN_ID'
aeg render --profile planner --root-token-id "$ROOT_ID" --output ./graphs/selected.html
```

`--task-ref` is an exact local match. It requires files: the control plane never
stores task references or private business labels. In hybrid mode it selects
locally matched roots with activity in the window and enriches them with fetched
central rows. It cannot select a central-only root by a label AAC does not hold.
For listing, actions without a mapping from supplied sidecar records remain
diagnostics: control-plane root summaries do not provide a per-token mapping.
Rendering [combo 5](#combo-5-control-plane-trace-data-application-action-records-discover-then-render) can instead use the selected root's detailed API
trace to join application records. No per-action network lookup or join by
purchase-order label or timestamp is attempted.

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

### Layout and participant legend

The page starts with a compact title, the full **Chain root token ID**
and the legend, followed immediately by the graph. This ID is the selected
chain's `root_token_id`, the same value passed to `--root-token-id`. You can select
the full ID; it wraps when needed. The graph fits the available viewport initially.
Use the zoom and pan controls for larger graphs: fitting all nodes does not make
every label readable at once. Double-click a node or edge for its details.
Scroll to read the page; enable the palm control when you want wheel gestures
to pan the graph instead.

The legend includes recipients as well as token creators. In the
travel example, **Vantis** and **Tourfedia** are the two tenants; **trip-planner**
and **booking** are their respective agents. The Tourfedia booking node is the
**intended recipient**, derived from the leaf token's audience constraint. That
constraint identifies who may receive the token. It does not, by itself, prove
that delivery, receipt verification or the business action occurred; those
claims require their own observations. Token creator and recipient are distinct
roles, so a Vantis-created token does not become a Tourfedia-created token merely
because it names Tourfedia as its recipient.

Colors identify participants consistently across their token and recipient
nodes. Vantis is blue and Tourfedia is orange in the travel example. Nodes belonging to
the same participant share a color; their token labels identify the individual
nodes. Written participant names and role shapes provide cues in addition to
color: originator ellipse, token rectangle and intended-recipient hexagon. An
unrecorded originator identity remains explicitly unknown.

Pale node fills and dark text keep labels readable. When the participant count
exceeds the palette, distinct `P1`, `P2`, … labels identify participants whose
colors are reused. Badges also identify abbreviated node labels; the full
identity remains in the legend and details. Equal display names include their
identities to distinguish them. Composite roots use a diamond; failure/decision badges and borders show
observed states while participant fills remain visible.

### Data sources used for this graph

The collapsible **Data sources used for this graph** panel replaces
**Evidence coverage and limitations**. There is one panel, **below the rendered
graph**, initially collapsed. Its summary names the source categories used;
expanding it shows the files, observed agents and tenants, timestamp span of the
contributing records, and control-plane query status, followed by applicable
limitations and next steps. A supplied file with no matching records is different
from one that contributed data. A requested query that failed is different from
a query that was not requested or one that succeeded with no matching observations.

For example, a graph rendered from two sidecar telemetry files and two
application action files, without `--profile` or `--trace-json`, reports:

| Data source | Used in this graph |
|---|---|
| Sidecar telemetry | Two files, from the planner and booking agents |
| Application action records | Two files, from the planner and booking applications |
| Control-plane trace data | Not included — no API query or saved trace was requested |

The record timestamp span describes available observations, not a guaranteed
execution start/end time or continuous logging coverage. Only limitations
relevant to the sources and results used in this graph follow the source list.

The panel explains what to do when an action or result is missing:

> A missing action or result means these inputs do not establish its outcome.
> First check the selected chain root, the supplied files and their observed
> times. Then add the relevant available sources and render again. More source
> categories can help only when they contain matching records; they cannot
> recover data that was never recorded or is no longer retained.

| What is missing or incomplete | What to do next |
|---|---|
| A participant, token or handoff | Supply that participant's retained sidecar telemetry with another `--events FILE`, if you are authorized to use it. An authorized control-plane trace may also add forwarded observations: add `--profile PROFILE` to a file-only render (combos 2 or 4), or use a saved trace export. |
| Business action details or a result such as a reservation ID | Supply the application's matching structured `action_taken` records with `--actions FILE` (combos 3, 4 or 5). Check their token IDs and the available token-to-root mapping. Control-plane traces deliberately omit private business payloads and full receipts. |
| A requested control-plane query failed | Check the reported diagnostic, profile/access configuration and connectivity, then retry. A failed query must not be treated as a successful query with no records. |
| Expected forwarded records have not arrived | Re-render later if forwarding may be delayed. If the records were never captured, were not forwarded or are outside retention, obtain retained local files where available; otherwise leave the outcome unknown. |

For the combo-3 example above, combo 4 may add control-plane observations, but
it does not guarantee a missing business result will appear. Rendering again
reads evidence; it does not retry the original business action.

### Interpreting observations

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

The versioned [action-taken-v1 JSON Schema](/action-taken-v1.json)
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
map of branch token references. Do not add a ninth required root field. A sidecar
observation from a supplied telemetry file or the detailed control-plane trace
provides the token-to-root mapping.

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
local graph or listing was produced. Ctrl-C returns 130 with one interruption
diagnostic on stderr and no traceback. These codes are not business outcomes.

Choose `--output` explicitly when rendering. The command refuses an output path
that would overwrite one of its evidence inputs.
