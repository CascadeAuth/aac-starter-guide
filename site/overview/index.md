Canonical: https://docs.cascadeauth.com/overview/

Applies to: AAC platform · developer beta

Documentation revision: dc7a41b77581b7ce6e83df2629fc2a2af41bc014

---

# Overview

## What AAC is for

AAC lets a network of AI agents — tens, hundreds or thousands of them, inside one
organisation and across organisations — carry **delegated authority** from agent
to agent, with provable identity, local verification and auditable receipts.

Authority starts with a decision your own application makes. Your application
authenticates the person, or obtains the approved service identity, and decides
what work it may authorize under your policy. AAC binds that decision into a
signed chain every later agent can check. In one chain:

1. **A person authorizes work.** The originating agent's sidecar **mints the root
   token**: a root block carrying your tenant id, a hash of the identity your
   application supplied, a hash of the originating workload's identity, the root
   key id, the signature algorithm and the issue time — signed with your tenant's
   **root signing key**. The sidecar then appends the first caveat, the class of
   action.
2. **Each agent that passes the work on attenuates the token.** It appends a
   caveat that cannot widen what may be done, can only shorten the expiry, and
   names the holder allowed to act next. Its sidecar signs a **proof of
   possession** with its identity key, showing that the workload presenting the
   certificate really holds the private key behind it.
3. **The receiving sidecar verifies locally**: the root signature against the
   originating tenant's published root public key, then the caveat chain and its
   conditions, then the presenter's proof of possession, its identity against the
   caveat that named it, and the replay check.
4. **The last agent** — the one with nobody left to call — finishes the work and
   signs a **receipt** that can be checked afterwards.

Two properties follow.

**Authority never widens as it travels.** A later hop's limits may stay the same
or become tighter; no operation produces a child token permitting more than its
parent. Holder binding is a separate control: each hop also names who may act
next, so the same chain does not become usable by a different agent.

**Every chain expires.** No chain outlives 24 hours from the moment its root was
signed. Work that runs longer takes a fresh authorization at a business
checkpoint rather than a longer chain.

### What local verification buys, and what it does not

Each hop is checked with local computation against trust material the sidecar
already holds: the root signature, the certificate chain, the proof of possession
and the chain's own conditions. Nothing on the request path asks the earlier
agents, or their identity providers, to re-authorize the hop — the person signs in
once, at the start, and the chain carries that decision onward. That is what keeps
authority affordable as a network grows: a chain crossing ten organisations makes
no fan-out of token-introspection calls to ten identity providers.

Three limits are worth knowing before you design around it:

* **Trust material is cached, and a cache can miss.** Sidecars refresh published
  root keys and CA certificates in the background, but a missing entry or a
  freshness deadline can make that refresh happen while a request is being
  verified — and verification **fails closed** when required trust material is
  unavailable or too stale.
* **A copied chain is not usable on its own, but a compromised agent is a
  different matter.** Whoever copies a chain still has to present a valid proof of
  possession as the holder the chain names, and still meets the replay checks. An
  attacker who has compromised an authorized agent is already inside those
  controls — which is why the business limits you put in caveats, not identity
  alone, are worth setting.
* **The shared durable replay profile adds a dependency** — a store your tenant
  operates — on the path of every received request. The Basic profile keeps replay
  state in the sidecar's own memory instead; see
  [replay protection profiles](https://docs.cascadeauth.com/sidecar/integration/#replay-protection-profiles).

### What a receipt proves

A receipt is your tenant's signed statement that an agent reported a particular
outcome. It is not by itself proof that the real-world action happened, and
checking one months later is not automatic: it needs the trust material published
at the time, an observation time you trust independently, and your own workflow
records. [Keys and certificates](https://docs.cascadeauth.com/overview/keys-and-certificates/) says what to keep;
[Verify terminal evidence offline](https://docs.cascadeauth.com/sidecar/operations/#verify-terminal-evidence-offline) has the
procedure.
## How a delegated workflow works

```text
Originator application
  |  mint-root: choose authority and submit a task
  v
Sidecar A --authenticated /invoke--> Agent A
  |  Agent A returns forward(destination, narrower predicates)
  |  signed chain + proof of the presenting workload
  v
Sidecar B --authenticated /invoke--> Agent B
  |  Agent B returns settle or refuse
  v
settle -> signed settlement evidence
refuse -> refusal result (no terminal attestation)
```

Sidecar B checks authority, identity, recipient and replay protection before
calling Agent B. Each agent still decides whether the requested business action
is appropriate. A `forward` decision can narrow authority, never broaden it.
The local example uses one sidecar twice; the two-agent example shows the same
flow with separate processes. Optional central telemetry correlates selected
metadata; full local evidence stays with the tenant.

| Term | Meaning and configuration |
|---|---|
| Tenant | The organization/project boundary assigned a `tnt-<uuid>` ID; `tenant.id` |
| Workload / agent | Your running application, identified by one concrete SPIFFE ID; `agent.spiffe_id` |
| Sidecar | The process beside a workload that verifies and carries authority |
| Root-signing key | Starts an authority chain; `tenant.signing_key_file` or a configured remote signer |
| SVID | An X.509 certificate binding a workload SPIFFE identity to its public key; `agent.svid_cert_file` |
| DPoP | Proof signed by the presenting workload, binding authority to the exact HTTP request; uses the local SVID key |
| Class of action | A named initial authority profile selected at mint time; `classes_of_action` |
| Predicate | A restriction such as `action`, `amount_max`, `task_ref` or expiry |
| Holder audience | The workload identity permitted to hold a chain step; class and attenuation audience constraints |
| Destination | A named peer URL, exact recipient identity and limits; `destinations` |
| Attenuation | Creating a child authority step with equal or narrower permissions |
| Continuation authority | A short-lived right to continue a verified inbound task for the same pair/task/presenter |
| Settle / terminal attestation | An agent finishes a task and its sidecar signs the terminal evidence using a distinct key |
| Pairing secret | Authenticates calls between one sidecar and its paired agent; `sidecar.agent_invoke_auth.secret_file` |
| Replay protection | Rejects repeated presenting proofs; `replay_protection` |
| A2A retry state | Retains dispatch outcomes so the same dispatch ID/body can be retried without executing twice; `a2a.egress_idempotency` |
[Run the reservation example](https://docs.cascadeauth.com/get-started/) or [integrate your own agents](https://docs.cascadeauth.com/sidecar/integration/).
