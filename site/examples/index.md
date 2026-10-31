Canonical: https://docs.cascadeauth.com/examples/

Applies to: AAC platform · developer beta

Documentation revision: c91ba3fb10dec19862e58be3d2c1d9ae8ef08599

---

# Examples

*AAC examples, including Google A2A*

Each example on this page is a public repository you clone and run against
the AAC Developer Beta. Every one registers the tenants it needs with the AAC
CLI, starts each agent beside its own sidecar with Docker Compose, lets the
agents do one piece of authorized work, and ends with the evidence the
sidecars wrote. They are teaching examples: small enough to read in one
sitting, runnable in a few steps, and honest about what they leave out. Each
README walks through its flow in the order it happens and points at the code
for each step.

All of them need macOS or Linux, Git, Python 3.11 or later, Docker with
Compose and Buildx, and a browser for the GitHub sign-ins that register the
tenants. Registrations are permanent and each example keeps its own CLI home,
so running two examples registers two pairs of tenants.

## One reservation over native AAC delivery

The [Compose demo](https://github.com/CascadeAuth/aac-compose-demo) is the
example the [home page](https://docs.cascadeauth.com/) and [Get started](https://docs.cascadeauth.com/get-started/) walk through.
Vantis Equity's trip-planner asks Tourfedia's booking workload to create a
reservation: the trip-planner's sidecar mints authority for the task, the
trip-planner narrows it to the order, Tourfedia's sidecar verifies it and
returns a signed terminal receipt, and the run ends with an execution graph of
the whole chain.
It shows the native delivery flow of [agent integration](https://docs.cascadeauth.com/sidecar/integration/),
with the forward, settle and refuse decisions, two more scenarios of the same
order, and a driver that exercises AAC's refusals.

```sh
git clone https://github.com/CascadeAuth/aac-compose-demo.git
cd aac-compose-demo
VANTIS_CONTACT='you+vantis@example.com' TOURFEDIA_CONTACT='you+tourfedia@example.com' ./quickstart
```

## Two Google ADK agents over A2A

The [ADK over A2A demo](https://github.com/CascadeAuth/aac-adk-a2a-demo) makes
the same reservation between two agents built with Google's Agent Development
Kit that talk A2A. The trip-planner's one tool hands the order to its own
sidecar, which mints and narrows the authority and delivers the message;
Tourfedia's sidecar verifies it and passes it, unchanged, to the booking agent
that ADK itself serves over A2A, whose one tool holds the reservation within
the amount it was allowed. It shows where an agent framework meets AAC: the
tool that sends through the sidecar, the pairing check in front of the
framework's server, and the reply profile the sidecar enforces, as described
on [A2A integration](https://docs.cascadeauth.com/sidecar/a2a/). A scripted model drives both agents by
default, so a run needs no model key and gives the same result every time; one
environment variable names Gemini or any model reached through LiteLLM,
including a local Ollama, and the key or address that model needs puts it in
place.

```sh
git clone https://github.com/CascadeAuth/aac-adk-a2a-demo.git
cd aac-adk-a2a-demo
VANTIS_CONTACT='you+vantis@example.com' TOURFEDIA_CONTACT='you+tourfedia@example.com' ./quickstart
```

## What the examples share

Every example installs the [AAC CLI](https://pypi.org/project/aac-cli/) in a
virtual environment, pulls the released [sidecar](https://docs.cascadeauth.com/sidecar/install/) and
[trust anchor publisher](https://docs.cascadeauth.com/trust-anchor-publisher/) images by digest, and builds
its small agent image from the repository. The CLI is the only generator of
keys, certificates and sidecar configuration; the examples read what it wrote
and never copy or edit it. Each repository's `CONTRIBUTING.md` states the
principles that keep it simple, and its `docs/evidence` folder records the
measured runs: the component releases, the commit and what each scenario
printed, never a contact address, a token or a key. The identifiers a run
leaves (root and token ids, and in the Compose demo's older records the
tenant and workload identities) are the public identifiers the execution
graph shows.

To read the evidence an example leaves behind, use the
[AEG guide](https://docs.cascadeauth.com/aeg/) for the execution graph and
[audit your workflows](https://docs.cascadeauth.com/sidecar/operations/#audit-your-workflows) for the
sidecar's event fields.
