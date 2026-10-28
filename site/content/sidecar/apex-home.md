# Authority that travels with the work

*AAC - Agent Authority Cloud - by CascadeAuth*

AAC (Agent Authority Cloud) is an AI agent authorization platform from
CascadeAuth. It lets you delegate and manage authority across collaborating
agents, from a small workflow to a larger network.

When agents hand work to one another, within an organization or across
organizational boundaries, AAC carries authority with every agent-to-agent
request. You can track and audit who authorized the work, what it permits,
and which agent may act next. Each hop can narrow that authority but cannot
widen it.

AAC combines a hosted service with a sidecar that runs beside each agent.
Each receiving sidecar verifies the authority's integrity and authenticity
locally. Signed receipts, audit records and the Agent Execution Graph help
operators and business owners trace and inspect recorded execution.

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

## Register and operate with the identities you already have

You can register a developer tenant and sign in with your own GitHub or
Google account. You do not need a separate AAC username or password.

You can also connect your organization's own identity providers so members
can sign in with their work identities to operate and use AAC. AAC supports
the OpenID Connect protocol. Microsoft Entra ID, Okta, Auth0 and Google
Workspace are supported out of the box. A sample connection file and a
console walkthrough for each supported provider are in
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
