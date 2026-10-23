Canonical: https://docs.cascadeauth.com/

Applies to: AAC platform · developer beta

Documentation revision: b0c0454e4b747f27ae11b3ff52b65daa41012f3e

---

# AAC documentation

AAC is the authorization layer for networks of AI agents. When agents hand work
to one another, inside one organization and across company boundaries, from a
simple two-agent exchange to a network of thousands of agents, AAC sends the
authority with every agent-to-agent request: who authorized the work, what it
permits, and which agent may act next. Each agent-to-agent hop can narrow that
authority but never widen it, every receiving agent verifies the authority on
the spot, and the work ends in a signed receipt and an execution graph you can
inspect.

A sidecar beside each agent holds the agent's identity, signs the authority the
agent passes on, and checks every agent-to-agent request before the agent sees
it: that the sender is the agent the authority names, and that the authority
itself is valid and was never widened along the way. The sidecar proves
identity and verifies authority. Transport encryption stays with your
deployment. Your agents, in any language or framework, keep their business
logic and leave to AAC the proof of who is calling and what they are allowed to
do.

[See it work](https://docs.cascadeauth.com/#see-it-work-in-ten-minutes) · [Understand AAC](https://docs.cascadeauth.com/overview/) ·
[Start the AAC journey](https://docs.cascadeauth.com/get-started/)

## What AAC adds to OAuth and API keys

An API key tells a service which program is calling. An OAuth access token
tells a service what an application may do there, on behalf of a person who
approved it or on the application's own behalf. Both answer one question for
one service: may this caller use this API?

Agents hand work to other agents. Vantis Equity's trip-planning agent asks
Tourfedia's booking agent to reserve a flight for Marc Sterling, a Vantis
director, under a $10,000 approval, within the next 30 minutes. An API key, or
an access token that only lists scopes, issued to the planner does not carry
that approval. Handing on a key or bearer token that the booking service
accepts gives the booking agent whatever the planner may do, for as long as
the credential lasts; a token bound to the planner's own key does not work for
anyone else. Exchanging the token for a narrower one means a call to an
authorization server at every hop, and servers that trust each other when the
hop crosses companies. Even then, the booking agent sees only what the latest
credential asserts: it cannot check for itself which approval the booking was
made under, or that each hop only narrowed it.

AAC carries the approval itself. Your application decides what the person may
authorize, and the originating agent's sidecar signs that decision as the root
of a chain. Each agent that passes the work on adds limits that can only
tighten, such as an $8,000 cap, and names the agent allowed to act next. Each
receiving sidecar verifies the whole chain locally, without calling back to the
earlier agents or their identity providers, and the last agent signs a
receipt. Your agents keep using OAuth and API keys for the ordinary APIs they
call. The [overview](https://docs.cascadeauth.com/overview/) explains what local verification guarantees
and what it does not.

## Who it is for

Developers and platform teams building AI agents that act for people and pass
work to other agents, inside one organization or across several. Each agent
needs to check the authority it receives, and you need a signed record
afterwards of what each agent was allowed to do and who passed the work on.
AAC runs beside the agents you already have: each agent gets a sidecar that
holds its identity and verifies incoming authority, and your application keeps
its own business rules. Agents in any language connect to their sidecar over
local HTTP, natively or with A2A.

## See it work in ten minutes

The public [Docker Compose demo](https://github.com/CascadeAuth/aac-compose-demo)
runs that reservation. Its quickstart installs the AAC CLI, registers the two
companies as tenants in the AAC Developer Beta, starts both agents with their
sidecars, makes the reservation and opens its execution graph in your browser:
the chain of agents, the limits each one set, and the signed receipt.

![Execution graph of a recorded quickstart run: the originator signed in at login.vantis.example, Vantis Equity's trip-planner tokens narrowing the authority hop by hop, and the Tourfedia booking agent the authority was addressed to, which received and acted](https://docs.cascadeauth.com/assets/quickstart-graph.png)

That graph is a recorded run. Your own run opens the interactive version, where
every node and edge shows the records behind it.

On macOS or Linux you need Python 3.11 or later, Docker with Compose and
Buildx, Git, and a browser for the GitHub sign-ins. On Linux, your user must be
able to run `docker` without `sudo`; on Debian or Ubuntu, also install the
`python3-venv` package. Replace the two example addresses with your own before
you run the command:

```bash
git clone https://github.com/CascadeAuth/aac-compose-demo.git
cd aac-compose-demo
VANTIS_CONTACT='you+vantis@example.com' TOURFEDIA_CONTACT='you+tourfedia@example.com' ./quickstart
```

The addresses become the contacts of the two tenants the quickstart registers,
which AAC keeps for the life of the beta; AAC's emails about resets and
breaking changes go to them ([below](https://docs.cascadeauth.com/#aac-developer-beta-free)). You sign in
with GitHub four times, two per tenant. Our measured first runs, with
downloads partly cached, took two to five minutes; on the timed Linux run most
of that was the four sign-ins ([recorded runs](https://github.com/CascadeAuth/aac-compose-demo/blob/main/docs/evidence/README.md)).
The demo's [Quickstart](https://github.com/CascadeAuth/aac-compose-demo#quickstart)
section covers reruns, the other scenarios and stopping the demo;
[Get started](https://docs.cascadeauth.com/get-started/) explains each step. The
[Examples](https://docs.cascadeauth.com/examples/) page lists every runnable example, including the same
reservation made by two Google ADK agents over A2A.

## AAC Developer Beta (free)

AAC hosts the Control Plane and public-trust service as AAC Developer Beta,
free of charge. It is for evaluation and integration development only, with no
service-level agreement and best-effort support at
**support@cascadeauth.com**. Your tenants and their data are kept for the life
of the beta: before any reset or deletion, the tenant's contact receives at
least 30 days' notice by email, except in an immediate response to a security
incident. Every change to the service is listed in the
[release notes](https://docs.cascadeauth.com/release-notes/#aac-developer-beta-service), and tenant
contacts receive an email before a breaking change or a reset. See
[the beta's commitments](https://docs.cascadeauth.com/control-plane/#aac-developer-beta-free).

## Components

### AAC CLI

Register tenants, configure agents and maintain identities and credentials.
The `aac-cli` package supplies both `aac` and `aeg`.

**Runs on:** your workstation or administration host.

[Get it on PyPI](https://pypi.org/project/aac-cli/) ·
[Install and use the CLI](https://docs.cascadeauth.com/cli/guide/)

### Sidecar

Carry delegated authority and verify incoming requests beside each agent.
Choose the container or a standalone Linux/macOS binary.

**Runs in:** your agent's network environment.

[Get it on Docker Hub](https://hub.docker.com/r/cascadeauth/aac-sidecar/) ·
[Install the sidecar](https://docs.cascadeauth.com/sidecar/install/)

### Trust anchor publisher

Publish your tenant's public root keys and CA certificates so other sidecars
can verify its authority and workload identities.

**Runs in:** your tenant, with access to its prepared public trust material.

[Get it on PyPI](https://pypi.org/project/aac-trust-anchor-publisher/) or
[GHCR](https://github.com/orgs/CascadeAuth/packages/container/package/aac-trust-anchor-publisher) ·
[Install and operate the publisher](https://docs.cascadeauth.com/trust-anchor-publisher/)

### Control Plane

Use AAC's shared API service for tenant administration, identity, public-trust
distribution and authorized execution queries.

**Runs as:** an AAC-hosted service, AAC Developer Beta (free).

[Connect to the service](https://docs.cascadeauth.com/control-plane/) ·
[View its endpoints](https://docs.cascadeauth.com/control-plane/#connect-to-the-developer-beta-service)

### Agent Execution Graphs (AEG)

Find an execution, combine available evidence and inspect its authority,
application actions and receipt-verification results.

**Runs on:** your workstation, using `aeg` from `aac-cli`.

[Get it with AAC CLI on PyPI](https://pypi.org/project/aac-cli/) ·
[Read the AEG guide](https://docs.cascadeauth.com/aeg/)

### Agent integration

Authenticate calls between a Python agent and its paired sidecar with
`aac-invoke-auth`. Its package page includes the FastAPI quick start and
framework-independent helpers.

**Runs inside:** your Python agent application.

[Get it on PyPI](https://pypi.org/project/aac-invoke-auth/) ·
[Connect your agent](https://docs.cascadeauth.com/sidecar/integration/) ·
[Integrate over A2A](https://docs.cascadeauth.com/sidecar/a2a/)

## Documentation policy

These stable pages describe the latest supported released components. Each
guide identifies its applicability and documentation revision; CLI and sidecar
versions advance independently. The PyPI and registry pages also include
installation and usage documentation.

Use [Keys and certificates](https://docs.cascadeauth.com/overview/keys-and-certificates/) to understand
custody and renewal across the components. [Release notes](https://docs.cascadeauth.com/release-notes/)
list changes to the hosted service and provide upgrade guidance. Historical
artifacts and release evidence remain with their publishers. Read the
[AAC Developer Beta](https://docs.cascadeauth.com/#aac-developer-beta-free) commitments and the
[sidecar license](https://docs.cascadeauth.com/LICENSE) before deployment.
