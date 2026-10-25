Canonical: https://docs.cascadeauth.com/release-notes/

Applies to: AAC Sidecar v0.5.6

Documentation revision: 601100d1b57b190de93e03e79ef0c53b4cbc5270

---

# Release notes

## AAC Developer Beta service

Changes to the hosted service, [AAC Developer Beta (free)](https://docs.cascadeauth.com/control-plane/#aac-developer-beta-free),
are listed here, newest first. Tenant contacts also receive an email before a
breaking change or a reset. Sidecar releases follow, by version.

- **2026-10-22:** The commitments are clarified: recovery from a failed change
  is not a reset. The service may be restored from a backup taken before the
  change, and AAC takes reasonable measures to avoid losing tenant data in that
  case but does not guarantee it during the beta, telling the affected tenant
  contacts afterwards which period was lost. The service itself is unchanged.
- **2026-10-17:** The beta's commitments are published: how long tenants and
  their data are kept, the notice before any reset or deletion, support, and
  these change announcements. The service itself is unchanged.

## 0.4.0

This guidance applies when upgrading to 0.4.0; it also covers behavior introduced
in earlier releases.

### Configuration upgrade note

For `sidecar.dev_mode` and
`sidecar.agent_invoke_context.include_full_prior_payloads`, use unquoted
`true` or `false`. Mixed-case spellings such as `yEs` now fail configuration
loading; check hand-edited configurations before upgrading. CLI-generated
configurations already use canonical booleans.

### Native forwarding upgrade note

Remove `valid_until` from every native
`forward` or `forward_composite` decision's `additional_predicates`, including
`additional_forwards` entries. Even equal or shorter supplied deadlines are
refused. Use the destination's configured `valid_for`; continuation expiry is
bounded by inherited authority and the 24-hour root limit. Dates inside your
business payload remain ordinary data. A2A's separate shorter-expiry contract
and the library's absolute expiry cap are preserved.

Native candidates are checked before outgoing proof signing or send. For
example, `amount_max:8000` cannot continue as `amount_max:9500`. The receiving
sidecar independently enforces this rule, including against a deliberately
constructed widened chain. Ordinary narrowing and fresh authority under a
still-valid original approval remain possible through the normal authorization
path; an existing narrow chain is not widened.

The native callback's `200` / `dispatched` acknowledgement precedes background
completion. Observe the later local outcome: a refused `forward` emits a
`dispatch` failure with `ERR_CHAIN_INVALID`; a refused reactive
`forward_composite` emits `composite_mint` with that code. Valid sibling branches
continue. Composite candidates are checked against their own fresh-root and
attestation chain. Proactive composite candidate rejection is a synchronous
403; reserved expiry input is an invalid-decision response before dispatch.

## 0.4.1

Upgrade guidance: remove any `state_store.cold` block, including empty or
null blocks, and replace configured class/destination `predicates.valid_until`
with `valid_for`. An omitted destination timeout now inherits the global
5-second default instead of the former independent 3-second default. Set an
explicit `timeout_ms` to retain a deliberate destination override. Conflicting
explicit task references refuse native decisions before any branch signs or
sends; already-committed roots retain their provenance in a 207 response.
With A2A enabled and `deadline_seconds` below 5, the unchanged global default
is too large: set an explicit destination `timeout_ms` no greater than that
deadline (for example, 3000ms for 3 seconds), or lower the global dispatch budget.
CLI-generated configurations already supply explicit destination timeouts.

## 0.4.2

This release documents the native two-tenant reservation demo and links its public
setup, receipt/refusal and certificate-lifecycle exercises. This release carries
the updated guide and overview; runtime authorization, configuration and wire
behavior are unchanged from v0.4.1. Existing v0.4.1 artifacts remain available unchanged.

## 0.4.3

Distribution update: the runnable image is published after its matching
signed bundle. Runtime behavior and configuration remain the same as v0.4.2.

## 0.4.4

The configuration template links to the standalone AAC developer documentation
site. Current guide corrections can publish independently of sidecar releases.
Runtime behavior, configuration and authorization remain unchanged from v0.4.3.

## 0.5.0

You can now describe your agent on its public A2A Agent Card. An optional
`a2a.agent_card` block in the sidecar configuration sets the name, description,
version, provider, documentation and icon links, and skills. An agent without
the block now presents the neutral name `AAC-enabled agent`, version
`unspecified` and one generic skill, in place of the earlier fixed pilot
wording. The sidecar still states the interface, capabilities, security and
content types itself. Existing configurations load unchanged; authorization
and wire behavior are the same as v0.4.4. See "Describe your agent on its A2A
Agent Card" in the configuration reference.

## 0.5.1

A sidecar whose `a2a` block leaves out both `continuation_authority` and
`egress_idempotency` now receives verified A2A messages normally. In v0.5.0 and
earlier that configuration started cleanly and served its Agent Card, but every
authenticated message failed with a dropped connection. Such a sidecar is
receive-only: its agent cannot send A2A messages until both blocks are added.
A configuration that has both blocks, as the published template does, was not
affected and behaves as before. See "Receive A2A messages without sending" in
the configuration reference.
## 0.5.2

The acknowledgement your agent receives from `POST /v1/agent/a2a/dispatch`
now carries the peer's reply: `a2a_response` holds the peer's validated
JSON-RPC answer, as the peer sent it, next to `dispatch_id` and `status`. The
whole acknowledgement is retained for the retry window, so an identical retry
returns the reply too. To make that possible the sidecar requires
`a2a.egress_idempotency.max_cached_response_body_bytes` to be at least
`a2a.max_request_body_bytes` plus 92; a configuration below that stops at
startup with a message naming both settings, and re-running the init command
for the agent writes a block that satisfies it. The retry database now holds
peer replies for the retention window. See the A2A integration page.

## 0.5.3

A security and toolchain release with no change to routes, configuration or
signed bytes. The sidecar is built with Go 1.27.2 and `golang.org/x/net`
v0.60.0, which fix the Go networking and TLS advisories present in v0.5.2's
build (GO-2026-6603 and eight related advisories). The standalone macOS
binaries now need macOS 13 Ventura or later; Linux binaries and the container
image are unaffected.

## 0.5.4

When the sender's lookup of the peer's identity at the control plane gets no
answer within its 5-second budget and the identity is not in the sender's
cache, the sidecar now retries the lookup once on a fresh request before
recording the receipt as `workload_unresolved`; before, the first failed
attempt recorded that value directly. The sidecar log states the actual
outcome of a failed lookup: the cached identity served, or the receipt check
recording `workload_unresolved`. The operations reference now lists every
`terminal_attestation_verification` value with its meaning and next step. No
change to routes, configuration, signed bytes or the verification verdicts.

## 0.5.5

An A2A exchange now records the same chain events as a native delivery: the
sender's sidecar writes `mint` (for an `originate` dispatch) and `dispatch`,
and the receiver's sidecar writes `receive`, linked by the root, parent and
task identifiers, beside the existing `a2a_egress` and `a2a_ingress`
diagnostics. An A2A run therefore forwards its chain events to central
telemetry like a native one and renders as an execution graph once the chain
rows are extracted from the sink (the A2A page's step 6 shows the two
commands; the renderer refuses a file that still holds the diagnostics). A
dispatch whose
message left but ended in a remote rejection, a timeout, an uncertain
delivery or an invalid reply records a `dispatch` failure with that code. No
change to routes, configuration, signed bytes or the verification verdicts.

## 0.5.6

A reply message no longer needs a `contextId`. The sidecar required one on
every message in a peer's reply (the direct message, a task's status message
and each history entry). The A2A 1.0 specification marks the field optional
in its Message table while its prose asks servers to provide it, and a common
agent framework such as Google ADK sets the id on the task and leaves it off
its own messages, so its reply was refused with `ERR_INVALID_AGENT_RESPONSE`.
As its own acceptance policy the sidecar now accepts a reply message without
the field; when present it must still be a nonempty string, and the task's
own `id` and `contextId` stay required. No change to routes, configuration,
signed bytes or the verification verdicts.
