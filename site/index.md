Canonical: https://docs.cascadeauth.com/

Applies to: AAC platform · developer beta

Documentation revision: b7e0bf78604db57f9974eee317f6c1baf3056e78

---

# AAC documentation

Carry delegated authority between agents. Learn how AAC binds identity,
limits and verification, then add its components to the environment where your
agents already run.

[Understand AAC](https://docs.cascadeauth.com/overview/) · [Start the AAC journey](https://docs.cascadeauth.com/get-started/)

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

**Runs as:** an AAC-hosted service in the developer beta.

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
provide upgrade guidance. Historical artifacts and release evidence remain
with their publishers. This is a public developer beta; consult the license
and support information before deployment.
