Canonical: https://cascadeauth.com/

Applies to: AAC platform · developer beta

Documentation revision: 6e61b5100d7f77cfeff663aa0dfb6ab666e45d21

---

# Authority that travels with the work

*AAC - Agent Authority Cloud - by CascadeAuth*

AAC is the Agent Authority Cloud, a platform from CascadeAuth: a hosted service
plus a sidecar you run beside each agent, together the authorization layer for
networks of AI agents. When agents hand work to one another, inside one
organization and across company boundaries, AAC sends the authority with every
agent-to-agent request: who authorized the work, what it permits, and which
agent may act next. Each hop can narrow that authority but never widen it,
every receiving agent verifies it on the spot, and the work ends in a signed
receipt and an execution graph you can inspect.

[Read the documentation](https://docs.cascadeauth.com/) ·
[Get started](https://docs.cascadeauth.com/get-started/) ·
[Run the demo](https://github.com/CascadeAuth/aac-compose-demo) ·
[CascadeAuth on GitHub](https://github.com/CascadeAuth)

## Why agents need more than OAuth and API keys

An API key tells a service which program is calling. An OAuth token tells a
service what an application may do there. Neither carries the approval an
agent received from a person, and neither lets the next agent check for itself
that the approval was only ever narrowed on the way. AAC carries the approval
itself: the originating agent's sidecar signs it, each agent that passes the
work on adds limits that can only tighten, and each receiving sidecar verifies
the whole chain locally, without calling back to the earlier agents or their
identity providers. Your agents keep using OAuth and API keys for the ordinary
APIs they call.

[How AAC works](https://docs.cascadeauth.com/overview/)

## Sign in with the identity you already have

Self-serve tenant registration and sign-in use GitHub or Google. There is no
AAC username or password anywhere; the CLI session is minted from the
provider's identity token.

A tenant can connect its own identity provider so its people sign in with
their work identity. AAC supports the OpenID Connect protocol. Microsoft Entra
ID and Okta are supported out of the box; Auth0 is in the supported family.
A sample connection file and a console walkthrough for each supported
provider are in
[aac-idp-connection-examples](https://github.com/CascadeAuth/aac-idp-connection-examples).

## See it work in ten minutes

The public Docker Compose demo runs a reservation between two companies'
agents: Vantis Equity's trip planner asks Tourfedia's booking agent to reserve
a flight under a $10,000 approval. Its quickstart installs the AAC CLI,
registers both companies as tenants in the AAC Developer Beta, starts the
agents beside their sidecars, makes the reservation and opens its execution
graph in your browser: the chain of agents, the limits each one set, and the
signed receipt.

[Run the demo](https://github.com/CascadeAuth/aac-compose-demo) ·
[Get started, step by step](https://docs.cascadeauth.com/get-started/)

## AAC Developer Beta, free

AAC hosts the Control Plane and public-trust service as AAC Developer Beta,
free of charge, for evaluation and integration development, with best-effort
support at **support@cascadeauth.com**. The documentation covers every
component: the AAC CLI, the sidecar, the trust anchor publisher, the Control
Plane and Agent Execution Graphs.

[Read the documentation](https://docs.cascadeauth.com/)
