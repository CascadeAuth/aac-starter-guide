Canonical: https://docs.cascadeauth.com/control-plane/

Applies to: Hosted AAC Control Plane · developer beta

Documentation revision: b655326328e82e8f4bacb002580c396564f0626c

---

# Using Control Plane

*Using AAC Control Plane*

The AAC Control Plane is the shared API service that connects tenant
administration, identity, public trust and execution queries. AAC hosts it
as **AAC Developer Beta (free)**. Your CLI, trust anchor publisher and
sidecars connect to its endpoints from your own environment.

Your tenant operates its agents and their sidecars, holds its private signing
material, and decides what business work to authorize. AAC operates the shared
Control Plane and public-trust endpoints.

## AAC Developer Beta (free)

AAC Developer Beta is the hosted Control Plane and public-trust service, free
of charge while the beta runs. These are its commitments:

- **Use:** evaluation and integration development only, not production or
  safety-critical use. There is no service-level agreement. Support is best
  effort, by email to **support@cascadeauth.com**.
- **Your tenants and their data:** kept for the life of the beta. Before any
  reset or deletion, the tenant's contact receives at least 30 days' notice by
  email. The only exception is an immediate response to a security incident.
  Recovery from a failed change is not a reset: the service may be restored
  from a backup taken before the change, and AAC takes reasonable measures to
  avoid losing tenant data in that case but does not guarantee it during the
  beta, telling the affected tenant contacts afterwards which period was lost.
- **Changes:** every change to the service is listed in the
  [release notes](https://docs.cascadeauth.com/release-notes/#aac-developer-beta-service). Tenant contacts
  also receive an email before a breaking change or a reset.

A tenant's contact is the address given with `--contact` when the tenant was
registered, and AAC's notices go there, so give an email address someone
reads. An administrator can change it with
`aac tenant update --tenant-id TENANT_ID --contact ADDRESS`; see the
[CLI command reference](https://docs.cascadeauth.com/cli/reference/).

## What it provides

| Service | How your tenant uses it |
|---|---|
| Tenant administration | Register a tenant and manage its identity-provider connection, credentials and trust domains through the AAC CLI |
| Security Token Service (STS) | Exchange supported identity evidence for short-lived tokens scoped to the intended AAC service |
| Workload and trust-domain registry | Register agent identities, use an AAC-assigned trust domain or bind a domain you control |
| Public-trust distribution | Accept signed publisher uploads and serve tenant root public keys and SPIFFE CA bundles |
| Execution metadata and audit queries | Receive opted-in central telemetry and answer authorized chain listing/trace queries |

Business requests travel between agents and sidecars. Local sidecar verification
uses trust material it has obtained and cached; the Control Plane does not
re-authorize each delegation by contacting all earlier agents. See
[the overview](https://docs.cascadeauth.com/overview/#what-local-verification-buys-and-what-it-does-not)
for the guarantees and limits.

## Connect to the developer-beta service

AAC Developer Beta runs in AAC's stage environment, which the
[AAC journey](https://docs.cascadeauth.com/get-started/) uses. It has an API endpoint and a public-trust
endpoint:

| Purpose | Endpoint |
|---|---|
| CLI administration, data APIs, STS and signed trust ingest | `https://api.stage.cascadeauth.dev` |
| Public root keys and SPIFFE trust bundles | `https://trust.stage.cascadeauth.dev` |

Install [AAC CLI from PyPI](https://pypi.org/project/aac-cli/), then create a
local profile for those endpoints:

```bash
aac profile create stage \
  --admin-url https://api.stage.cascadeauth.dev \
  --data-plane-url https://api.stage.cascadeauth.dev
aac profile show stage --output json
```

Creating a profile records local connection settings. Continue with
[tenant registration and sign-in](https://docs.cascadeauth.com/cli/guide/#register-a-tenant), or use your
existing tenant and approved administrator identity. If the `stage` profile
already exists, inspect it before changing it. Other AAC environments supply
their own endpoint addresses.

## Which component authenticates each request

- **AAC CLI:** performs supported registration and administrator sign-in flows,
  then uses the resulting credentials for tenant operations.
- **Trust anchor publisher:** signs public-material uploads with the tenant's
  registered administration key. [Configure the publisher](https://docs.cascadeauth.com/trust-anchor-publisher/).
- **Sidecar:** uses the configured credentials for services such as workload
  lookup and central telemetry; the telemetry path exchanges its API-key evidence
  through STS before ingestion. [Configure a sidecar](https://docs.cascadeauth.com/sidecar/configuration/).
- **Trust readers:** fetch public root keys and CA bundles from the public-trust
  endpoint. Private keys are retained by the tenant's components.

Keep the credential roles distinct. The [keys and certificates guide](https://docs.cascadeauth.com/overview/keys-and-certificates/)
explains which component holds each one, and the [CLI guide](https://docs.cascadeauth.com/cli/guide/#manage-credentials)
covers rotation and recovery.

## Check service and tenant state

Check API reachability, then use your authenticated profile to inspect the tenant:

```bash
curl --fail --silent --show-error https://api.stage.cascadeauth.dev/healthz
aac tenant list-workloads --profile stage --output table
aac trust-anchor list --profile stage --output table
```

A successful health response establishes service reachability. Tenant queries
and an authenticated agent workflow establish that your particular setup works.

## Find an execution

With central telemetry enabled and observations available to your tenant:

```bash
aac chain list --profile stage --since 24h --output table
aeg list --profile stage --since 24h --output table
```

The Control Plane exposes authorized execution metadata. Tenant-local files can
add richer authority and application details; they are not uploaded just because
you open a graph. Use the [AEG guide](https://docs.cascadeauth.com/aeg/) to combine sources, select a root
and understand partial coverage.

Use the [CLI command reference](https://docs.cascadeauth.com/cli/reference/) for the released administration
and query interface, and [operations](https://docs.cascadeauth.com/sidecar/operations/) for diagnostics.
