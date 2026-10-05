Canonical: https://docs.cascadeauth.com/sidecar/

Applies to: AAC Sidecar v0.4.4

Documentation revision: d9080525c18de9527631a4702a71536345a3b31b

---

# AAC Sidecar

The sidecar runs beside your agent. It carries delegated authority, checks
incoming requests, and passes verified context to the agent's business logic.
The agent decides what work to do; the sidecar handles the authority chain,
identity proofs and signed terminal evidence.

## Download the sidecar

Get the released container and its operating guide from
[AAC Sidecar on Docker Hub](https://hub.docker.com/r/cascadeauth/aac-sidecar/):

```bash
docker pull docker.io/cascadeauth/aac-sidecar:v0.4.4
docker run --rm docker.io/cascadeauth/aac-sidecar:v0.4.4 -version
```

Continue with [download and installation options](https://docs.cascadeauth.com/sidecar/install/) for the
container or a standalone Linux/macOS binary. For a complete first example,
[start the AAC journey](https://docs.cascadeauth.com/get-started/).

## Connect it to your agent

1. Use the [AAC CLI](https://docs.cascadeauth.com/cli/guide/) to register the tenant and prepare the agent's
   identities, credentials and configuration.
2. Run the [trust anchor publisher](https://docs.cascadeauth.com/trust-anchor-publisher/) for the tenant's
   public root keys and CA certificates.
3. Place the sidecar in the same loopback network environment as its paired
   agent—for example, in the same Kubernetes Pod or a shared Docker network
   namespace. Follow [configuration and placement](https://docs.cascadeauth.com/sidecar/configuration/).
4. Add pairing authentication to the agent. Python applications can install
   [aac-invoke-auth from PyPI](https://pypi.org/project/aac-invoke-auth/), which
   documents its FastAPI integration and framework-independent helpers.
   See [agent integration](https://docs.cascadeauth.com/sidecar/integration/) for the request/response flow.

The sidecar uses the [Control Plane](https://docs.cascadeauth.com/control-plane/) for configured identity,
trust and telemetry services. Business requests travel between the tenant's
agents and sidecars.

## Operate and inspect

Use the [operations guide](https://docs.cascadeauth.com/sidecar/operations/) for startup, readiness,
diagnostics, credential maintenance and upgrades. The
[configuration reference](https://docs.cascadeauth.com/sidecar/configuration/#configuration-and-workflow-state)
explains replay and workflow state in your environment.

Use [AEG](https://docs.cascadeauth.com/aeg/) to find an execution and inspect the recorded authority,
application actions and receipt-verification results. Each source has its own
coverage; an execution graph describes the evidence available to the query.
