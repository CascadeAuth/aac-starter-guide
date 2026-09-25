# Agent Execution Graph

Version: `aac-aeg 0.1.0`.

`aac-aeg` reconstructs observed authority and application activity from local
sidecar logs, application records and authorized central trace metadata. It
writes an interactive HTML file; no server is needed to view it. Records and
output stay on the operator's machine. The renderer never uploads local files.

Requires Python 3.10 or later:

```sh
python -m pip install aac-aeg
# To query an existing AAC CLI profile, also install the compatible public CLI:
python -m pip install 'aac-aeg[online]'
```

The online extra supplies `aac-cli>=0.2.3`. Online rendering invokes
`aac chain show --profile PROFILE --token-id ROOT --output json` with an argument
list. It uses the CLI's existing credentials; it keeps no second credential
store. Offline rendering never invokes `aac`, even with an ambient profile.

## Find an execution and render it

Sidecars write their configured local telemetry sink. In the CLI-generated
Compose layout, `aac agent status --agent NAME` identifies the agent directory;
`compose.env` names `AAC_AGENT_STATE_DIR`. The file is normally
`<agent-directory>/state/telemetry.jsonl` on the setup host, mounted at
`/var/lib/aac/telemetry.jsonl`. A path on that host is not automatically available
on another laptop. Use a retained file sink and explicitly obtain any partner
files you are authorized to hold.

```sh
aac-aeg list --events ./planner-telemetry.jsonl \
  --actions ./planner-actions.jsonl --since 24h --output table

aac-aeg render --mint-response ./start-response.json \
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

`list` supports local files, `--task-ref` (exact match), `--since 30m|24h|7d`,
`--from TIME`, `--to TIME`, and `--output table|json`. Explicit times require a
timezone; the UTC interval includes its start and excludes its end. `--since`
and `--from` are mutually exclusive. Times are observed activity, not guaranteed
chain start or business completion. Roots, task references and file/line sources
are included in JSON output. Profile/hybrid listing is not available in this
release. Actions without a sidecar token-to-root mapping remain diagnostics;
the tool never joins by purchase-order label or timestamp alone.

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
is also installed as `aac_aeg/data/action-taken-v1.json`. Any standard JSON Schema
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

## Boundaries

Designed for tens of displayed nodes in a presentation, roughly 100–200 for
investigation with pan/zoom; this is planning guidance, not a certified cap.
Ordinary repeated attempts in current files are supported. Rotated/copied-file
qualification, detailed competing-source presentation and standalone validation
are separate future work. No remote log collector or central business-data search
is included. Self-contained HTML retains the embedded dependency license notices.

Exit codes: 0 means the requested local operation completed, 2 means input,
selection or output failure, and 4 means a central query failed but a partial
local graph was written. These codes are not business outcomes.

The Python library imports as `aac_aeg`. Default library output is
`./aeg-out`, never the installed package directory; the CLI requires `--output`.
