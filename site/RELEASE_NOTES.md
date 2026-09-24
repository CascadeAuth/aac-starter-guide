# Release note

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
