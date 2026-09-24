# Keys and certificates

Setting up AAC means creating a small web of key pairs, certificates and shared
secrets, putting each one where it belongs, and replacing it before it runs out.
That web is the real work of onboarding, and this page is its map. For every item
it says what the item proves, where it lives, who gets a copy, and how long it
lasts.

Read it once before you create your first agent, and come back when something
expires or when you move from a development machine to your organisation's own
certificate authority.

Two words used throughout. A **tenant** is one organisation registered with AAC.
An **agent** is one of your workloads, running beside its own AAC sidecar.

## Who signs your agents' certificates

Everything else on this page follows from one choice, and AAC's control plane is
not part of it: **AAC issues no certificates and never holds a private key of
yours.** Either the `aac` command-line tool creates a development certificate
authority on your own machine, or your organisation's issuer signs your agents'
certificates and the tool never sees that authority's private key.

<!-- material-cases:start -->

<!-- Generated from aac_cli/material_cases.py. Do not edit by hand. -->

### The CLI creates a development CA

The laptop case. The CLI creates a certificate authority on this machine and signs the agent's identity, receipt and HTTPS certificates with it.

**Flags.** No flags are needed. To reuse a development CA across agents, pass `--ca-key-file` and `--ca-cert-file` together; neither one alone.

**Keys and signatures.** The CA and the two identity keys are Ed25519; the HTTPS key is EC P-256.

**The CLI** creates a 7-day certificate authority and keeps its private key in the agent's keep/ folder; issues the workload, receipt and HTTPS certificates; publishes the CA certificate as a trust anchor named `<agent>-dev-ca`.

**The CLI does not** ask you for anything from your own certificate authority.

**Renewal.** `aac agent renew --agent <name>` issues fresh certificates from the same CA.

### I bring my own CA

Your own issuer has signed the agent's certificates, and your CA private key never reaches this machine. Certificate source alone does not qualify a production deployment.

**Flags.** All seven together: `--workload-cert-file`, `--terminal-cert-file` and `--tls-cert-file`, each with its key file (`--workload-key-file`, `--terminal-key-file`, `--tls-key-file`), plus `--ca-cert-file`. Never `--ca-key-file`: the CLI does not want your CA key.

**Keys and signatures.** Your CA's key must be Ed25519 or EC P-256, and it must have signed each certificate with Ed25519 or ECDSA-with-SHA-256. The two identity keys may be Ed25519 or EC P-256; the HTTPS key must be EC P-256. RSA is not supported: the sidecar cannot verify against it.

**The CLI** checks each certificate against its key, its issuer and its validity window, and HTTPS certificates against every configured connection name; registers the workload and writes the settings files and the pairing secret; publishes your CA certificate as a trust anchor named `<agent>-ca`.

**The CLI does not** create a certificate authority; issue any certificate; ask for, read or store your CA private key.

**Renewal.** `aac agent renew --agent <name>` cannot reissue what it did not sign: it takes the replacements your issuer produced.

<!-- material-cases:end -->

Your choice stays visible after setup, in two places.

**In the name your tenant publishes.** An authority the tool created is published
as the trust anchor `<agent>-dev-ca`; your own issuer's is published as
`<agent>-ca`. Another organisation's operator can therefore tell, before trusting
you, whether they are trusting a disposable seven-day development authority or a
company issuer. An agent's root key id does not follow that choice — it is always
`<agent>-root-v1`, derived from the agent's name.

**In how many authorities you have — and how many entries they publish.** The
command-line tool creates **one development authority per agent**, so a machine
with three agents has three authorities. An organisation using its own issuer
commonly has **one authority for the whole organisation**; that is a choice its
own certificate authority makes, and it is not the same as publishing one entry.
The anchor id is derived from the agent's name, so `payments` and `booking`
publish `payments-ca` and `booking-ca` even when the same issuer signed both
certificates — one issuer, one certificate, one entry per agent. Both shapes are
supported. Where the rest of this page differs between them, it says so.

## What exists once for the whole tenant

| What | What it proves | Where it lives | Who gets a copy | How long it lasts |
|---|---|---|---|---|
| Tenant API key | that a caller is acting for your tenant on AAC's data calls | on the machine that runs the `aac` command, and on each sidecar that reads your workload records or reports telemetry | every sidecar that needs one | until you reissue it with `aac tenant reissue-api-key` |
| Administrator sign-in session | that a tenant administrator is signed in right now | only the machine you signed in on | nobody | hours; sign in again with `aac sso login` |
| Administrator signing key | that published trust material really came from your tenant — the publisher signs every upload with it | the machine that runs the publisher | nobody. AAC received only its public half, when you registered | until you rotate it, on the schedule below |
| Your certificate authority | that an agent holding a certificate it signed is one of yours. A receiving sidecar fetches your authority's certificate from AAC and checks the certificate the calling agent presents | the **certificate** sits with each agent and in your tenant's publish folder. The **private key** stays with your issuer, or — when the tool made the authority — in that agent's `keep/` folder | only the certificate leaves. AAC serves it to anyone at your tenant's trust URL; the private key never leaves you | your issuer decides; a development authority the tool created lasts 7 days |
| Publisher settings | not a key: where the publisher finds your public material and where to send it | the machine that runs the publisher | — | rewritten whenever you run setup again |

**The trust-anchor publisher is a process, not a key.** It watches the two folders
holding your public material — your agents' root public keys and your authority's
certificates — and uploads anything new, signed with your administrator key. It
creates nothing and rotates nothing; it only distributes public results. It does
not need to run all the time, but it must be running whenever that material
changes, so most tenants simply leave it running.

How many publisher processes you need depends on your trust domains, not on your
agent count. The rule is one writer for your tenant's **root-key set**, and one
writer for each **active domain binding**. One tenant with one trust domain
therefore runs one publisher. A tenant that keeps its AAC-assigned domain and adds
a domain of its own runs two processes — one per domain binding — with root-key
publishing enabled in exactly one of them.

## What exists for each agent

| What | What it proves | Where it lives | Who gets a copy | How long it lasts |
|---|---|---|---|---|
| Identity key and certificate | that this workload is `spiffe://<your trust domain>/<agent>`. Its sidecar signs a proof of possession with the key on every call, so holding the certificate is not enough | its own sidecar | **the key: nobody.** The certificate is public and travels — the sidecar presents it to every workload it calls, inside the proof of possession | 1 day, when the tool issues it |
| Receipt key and certificate | that this agent finished the work, in a receipt others can check afterwards. Setup gives it its own key, separate from the identity key, so the two signing jobs stay separate on disk and in the configuration | its own sidecar | **the key: nobody.** The certificate travels inside every receipt this agent signs, so whoever checks the receipt gets it | 1 day, when the tool issues it |
| HTTPS key and certificate | lets callers reach this sidecar over HTTPS. Its certificate has to name the address the sidecar is actually served on | its own sidecar | **the key: nobody.** The certificate is what every TLS client sees when it connects | 1 day, when the tool issues it |
| Root signing key | that a chain of authority started here. It signs the first block of every chain this agent begins | its sidecar holds the private half | the **public** half is published: setup copies it into your tenant's publish folder, the publisher uploads it, and AAC serves it under the key id `<agent>-root-v1` | until you retire that key id |
| Pairing secret | that a call really came from your own application, and from its own sidecar — in both directions. It is **one shared secret, not a key pair**: the same bytes sit in both processes and there is no public half | its sidecar and authorized processes within that tenant application’s trusted boundary | never another pair or tenant; this is not a mint-only credential | until you regenerate it |
| List of trusted authorities | which authorities this sidecar accepts on the calls it makes | its own sidecar | nobody else | rebuilt each time you renew |
| Workload registration | AAC's record that this identity is one of your agents. Not a key and not a file: it carries the identity string only, no key material | AAC's registry | — | until you deactivate it |

**What the separate receipt key does and does not buy.** Setup gives the receipt
its own key, so the two signing jobs are separate: separate files, separate
configuration. That is where the separation ends — it is not a check made when a
receipt is verified. A receiving sidecar checks that the certificate in a receipt
chains to your published authority, names the expected agent, and matches the
signature — and your identity certificate satisfies all three, because it carries
the same identity and the same issuer. So treat both keys as one blast radius:
whoever holds an agent's identity key can also produce a receipt that verifies
for that agent.

Other organisations' agents fetch your published authority certificates and root
public keys from AAC's trust URL. **Public certificates are meant to travel** —
they are presented on calls, carried in receipts and served to TLS clients. What
never leaves you are the private keys and the pairing secret.

## What stays with you, and what your application receives

**Never leaves you.** Your certificate authority's private key — held by your
issuer, or kept in the agent's `keep/` folder when the tool created the authority.
Your administrator signing key. Every agent's root signing private key, and its
identity, receipt and HTTPS private keys. Every pairing secret. Your tenant API
key.

An explicitly authorized separate originator may hold this pair's secret only
within the same trusted application boundary. It can sign native chain-start
requests as well as callbacks; the credential is not limited to minting.
Native `/v1/agent/mint-root` and `/v1/agent/delegations` require it from v0.4.0,
as do the existing paired callback/A2A surfaces described in the guide.
Never share the secret across pairs or tenants.

**What your own application gets.** The only **secret** your application ever
receives is its pairing secret. It also receives a copy of your certificate
authority's certificate, which is public, so it can trust its sidecar over HTTPS.
Nothing else: your application never holds a signing key, and it never needs one.

## What setup prepares, and what the runtime actually uses

Setup prepares a **root signing key for every agent**. Only agents that *start*
work use it. An agent that receives work and passes it on narrows the authority it
was given and signs its proof with its identity key, not with a root key — so on a
forwarding agent the root key sits prepared and unused. That is deliberate: it
means an agent can begin starting work later without another setup pass.

Read the two tables above the same way. They list what a complete agent has
available, not what every deployment exercises.

## The picture

```text
ONCE FOR THE TENANT                     FOR EACH AGENT
  Tenant API key ------------------->     Sidecar
  Administrator signing key                 identity   key + certificate  \
    |                                       receipt    key + certificate   >- signed by
    |  signs every upload                   HTTPS      key + certificate  /   your CA
    v                                       root signing key  (used only when
  aac-trust-anchor-publisher                  this agent starts the work)
    ^        ^                               pairing secret  <--+
    |        |                                                  |  same bytes
    |        +-- each agent's root PUBLIC key                    |  in both
    +----------- your CA certificate                          Your application
                   the tool made it:    <agent>-dev-ca           pairing secret
                   your issuer made it: <agent>-ca               CA certificate (public)
    |
    v
  AAC's trust URL
    |
    |  fetched and cached by
    v
  Receiving sidecars, in any tenant -- they never need anything private of yours

NEVER LEAVES YOU
  your CA's private key      the administrator signing key      the tenant API key
  every root signing key     every identity/receipt/HTTPS key   every pairing secret
```

## How long things last, and what to do when they run out

**Short-lived, and replaced by one command.** An agent's identity, receipt and
HTTPS certificates last a day when the tool issues them, and a development
authority lasts seven days. `aac agent renew --agent <name>` replaces the
certificates; add `--ca` to replace the development authority as well, which also
puts the new authority certificate in your publish folder. When your own issuer
signed them, that issuer produces the replacements and `renew` takes them — it
cannot reissue what it did not sign.

**Persistent, and not covered by that.** Your root signing keys, your pairing
secrets, your tenant API key, your administrator signing key and your publisher
settings do not expire on their own. Waiting does not retire them. Each one stays
valid until you deliberately replace it, so treat them as things you hold and look
after, not as material that ages out.

That distinction matters when a machine is lost or a secret may have leaked. The
short-lived material is genuinely disposable — reissue it and move on. The
persistent material is not, and needs a deliberate decision each time.

## Rotating the tenant administrator key

Your administrator signing key is what makes published trust material yours, so
rotate it:

* **as soon as you suspect it leaked**, or see tenant activity you cannot account
  for;
* **when someone with access to it leaves** your organisation or changes role;
* **once a year**, as routine, even when nothing has gone wrong.

Create the key pair yourself first — AAC only ever receives the public half, and
the command refuses a private key rather than transmitting it:

```bash
umask 077
openssl genpkey -algorithm ed25519 -out tenant-admin.pem
openssl pkey -in tenant-admin.pem -pubout -out tenant-admin.public.pem
aac tenant rotate-admin-key --tenant-admin-pubkey-file tenant-admin.public.pem
```

Rotation is **immediate and forward-only**. The previous key stops being accepted
for uploads at once — there is no grace window, and it can never be reinstated.
So plan the swap: a running trust-anchor publisher holding the old private key
must be given the new one and **restarted**, because it reads its key once, at
startup. Until you do, its uploads are refused.

## The exact file names

This page deliberately names roles rather than paths, because where a file lands
depends on how you set the agent up. The command-line tool publishes the exact
list — every file it creates, where it puts it, and whether to back it up — in the
section "What each file is for, and what to back up" on its own page:
<https://pypi.org/project/aac-cli/>. That table is generated from the tool's own
source, so it cannot drift from what the tool actually writes.

## Keeping a receipt verifiable months later

A receipt is a signature over what the last agent reported, made with a
certificate that was valid when the work finished. Checking one long afterwards is
not automatic, and it needs three things you keep yourself:

1. **the trust material that was published at the time** — AAC serves what is
   current, not an archive, and a development certificate may have been valid for
   only a day;
2. **an observation time you trust independently**, rather than the time written
   inside the evidence being checked;
3. **your own workflow and authorization records**, which are what connect a
   receipt to the task it belongs to and to the person who approved it.

It is also worth being clear about what a receipt is. It is your tenant's signed
statement that an agent reported a particular outcome. It is not, by itself, proof
that the real-world action happened. The developer guide's "Verify terminal
evidence offline" section has the procedure and its limits in full.
