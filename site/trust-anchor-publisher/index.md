Canonical: https://docs.cascadeauth.com/trust-anchor-publisher/

Applies to: aac-trust-anchor-publisher 0.2.3

Documentation revision: c1c9bfe34df3f9d320174d8f8ae785455dfcf5bd

---

# Install and operate the trust anchor publisher

The publisher runs inside your tenant and sends public trust material to the
[Control Plane](https://docs.cascadeauth.com/control-plane/). Other tenants' sidecars read it to verify your
authority chains and workload identities.

Choose one deployment mode for each publication role:

- [Run a container](https://docs.cascadeauth.com/trust-anchor-publisher/#run-a-container): use the released GHCR image and Docker or
  your existing container platform.
- [Run a standalone process on a host](https://docs.cascadeauth.com/trust-anchor-publisher/#run-a-standalone-process-on-a-host):
  install the PyPI package and run it directly or as a system service.

The [AAC journey](https://docs.cascadeauth.com/get-started/) uses the container mode through Docker Compose.
The two paths below install the same publisher; you do not need both.

## Prepare the inputs for either mode

Complete [tenant and agent setup](https://docs.cascadeauth.com/cli/guide/#prepare-and-maintain-an-agent)
first. Setup prepares public-material folders and a publisher environment file.
For CLI-managed Compose, use its generated configuration and mounts:
`compose.env` identifies `AAC_PUBLISHER_ENV_FILE` and the tenant directory.

| Publication role | Public input | Published result |
|---|---|---|
| Root keys | One `<key_id>.pub.pem` per root-signing public key | The tenant's public JWK Set |
| SPIFFE bundle | One `<anchor_id>.ca.pem` per public CA certificate | The trust bundle for an active domain binding |

Run one writer for the tenant's root-key set and one for each domain bundle.
One process can serve both roles for one domain. Several domains need separate
bundle publishers, with root-key publication enabled in only one process.

The publisher signs uploads with the tenant-admin private key. Root-signing
private keys, CA private keys, workload private keys and pairing secrets stay
with their own components. See [keys and certificates](https://docs.cascadeauth.com/overview/keys-and-certificates/).

## Run a container

### Pull and configure the container

Get the [released image from GHCR](https://github.com/orgs/CascadeAuth/packages/container/package/aac-trust-anchor-publisher):

```bash
docker pull ghcr.io/cascadeauth/aac-trust-anchor-publisher:0.2.3
```

The following Linux-host example publishes root keys. Replace the tenant ID
with your registered tenant. The host admin key and public-key directory must
already exist. As described in the [container operating guide](https://pypi.org/project/aac-trust-anchor-publisher/#running-in-a-container),
keep the material readable by the host's `aac` group (files mode 640,
directories mode 750). The image runs as a non-root user; the added group grants
read access without making private material world-readable.

```bash
docker run -d --name aac-trust-anchor-publisher \
  --restart unless-stopped \
  --group-add "$(getent group aac | cut -d: -f3)" \
  -e AAC_TAP_TENANT_ID=tnt-550e8400-e29b-41d4-9716-446655440000 \
  -e AAC_TAP_ADMIN_KEY_FILE=/keys/tenant-admin.pem \
  -e AAC_TAP_ROOT_KEYS_DIR=/root-keys \
  -e AAC_TAP_ROOT_KEYS_INGEST_URL=https://api.stage.cascadeauth.dev/v1/root-keys/ingest \
  --mount type=bind,src=/etc/aac/keys/tenant-admin.pem,dst=/keys/tenant-admin.pem,readonly \
  --mount type=bind,src=/etc/aac/root-keys,dst=/root-keys,readonly \
  ghcr.io/cascadeauth/aac-trust-anchor-publisher:0.2.3
```

For the bundle role, mount its public CA directory read-only and supply these
additional environment variables to the container:

| Variable | Container value |
|---|---|
| `AAC_TAP_SPIFFE_BUNDLE_DIR` | The directory **inside** the container where the CA files are mounted |
| `AAC_TAP_SPIFFE_TRUST_DOMAIN` | Your tenant's active assigned or custom trust domain |
| `AAC_TAP_SPIFFE_BUNDLE_INGEST_URL` | `https://api.stage.cascadeauth.dev/v1/spiffe-bundle/ingest` |
| `AAC_TAP_SPIFFE_BUNDLE_READ_URL` | `https://trust.stage.cascadeauth.dev/.well-known/spiffe-bundle/<TRUST_DOMAIN>` |

Use an environment file with `--env-file` instead of separate `-e` options if
preferred. Its file paths must name the container mounts, not the host paths.
For another AAC environment, use the endpoints supplied by its operator.
The container needs outbound HTTPS and no inbound listening port.

### Operate the container

Read the container logs:

```bash
docker logs -f aac-trust-anchor-publisher
```

An exit code of 2, often shown as repeated restarts, means configuration or
admin-key loading failed. Read the logs and fix the inputs. After changing the
environment or admin key, recreate the container using the corrected command:

```bash
docker stop aac-trust-anchor-publisher
docker rm aac-trust-anchor-publisher
```

These commands remove only the container; bind-mounted keys and public material
stay on the host. Run the start command again. On another container platform,
use that platform's equivalent configuration, restart policy and logs.

## Run a standalone process on a host

### Install the Python package

Get the [package and full host operating guide from PyPI](https://pypi.org/project/aac-trust-anchor-publisher/).
Use a dedicated virtual environment on the host that will run it:

```bash
python3 -m venv .aac-publisher
. .aac-publisher/bin/activate
python -m pip install --upgrade aac-trust-anchor-publisher
aac-trust-anchor-publisher --help
```

### Configure and start the host process

Use the generated publisher environment for CLI-managed setup. For an
operator-managed setup, these exports illustrate a root-key publisher. Replace
the tenant ID and host paths with your own prepared values:

```bash
export AAC_TAP_TENANT_ID=tnt-550e8400-e29b-41d4-9716-446655440000
export AAC_TAP_ADMIN_KEY_FILE=/etc/aac/keys/tenant-admin.pem
export AAC_TAP_ROOT_KEYS_DIR=/etc/aac/root-keys
export AAC_TAP_ROOT_KEYS_INGEST_URL=https://api.stage.cascadeauth.dev/v1/root-keys/ingest
export AAC_TAP_POLL_INTERVAL_SECONDS=60
aac-trust-anchor-publisher
```

It runs in the foreground and logs to stdout/stderr. Stop that process before
starting another writer with changed settings. To also publish a bundle, add
the following values for an active domain binding, then start with both roles:

```bash
export AAC_TAP_SPIFFE_BUNDLE_DIR=/etc/aac/spiffe-bundle
export AAC_TAP_SPIFFE_TRUST_DOMAIN=agents.example.com
export AAC_TAP_SPIFFE_BUNDLE_INGEST_URL=https://api.stage.cascadeauth.dev/v1/spiffe-bundle/ingest
tap_trust_url=https://trust.stage.cascadeauth.dev
tap_bundle_path=".well-known/spiffe-bundle/${AAC_TAP_SPIFFE_TRUST_DOMAIN}"
export AAC_TAP_SPIFFE_BUNDLE_READ_URL="${tap_trust_url}/${tap_bundle_path}"
aac-trust-anchor-publisher
```

Use your tenant's actual trust domain and put its public CA certificates in
the bundle directory. These are paths on this host. The read URL names the
full public bundle path. The host needs outbound HTTPS; there is no listener.

### Operate the host process

For a managed Linux service, the wheel supplies a systemd unit:

```bash
aac-trust-anchor-publisher --print-systemd-unit
```

Follow the [systemd setup instructions](https://pypi.org/project/aac-trust-anchor-publisher/#running-under-systemd)
for the environment file, service account and unit. The supplied unit expects
`/opt/aac/venv`; adjust `ExecStart` if you used the virtual environment above.
The service account needs read access to its configured material. Use
`systemctl` and `journalctl` for this host service.

Configuration and the admin key are read at startup. Restart the foreground
process or systemd service after changing them. Exit code 2 means an invalid
setting or unreadable admin key; fix the cause before restarting.

## Verify publication in either mode

A running process is not proof of publication. Check accepted-ingest logs and
the public endpoints your counterparties use. From a workstation, set the
tenant ID and trust domain explicitly:

```bash
tenant_id=tnt-550e8400-e29b-41d4-9716-446655440000
trust_domain=agents.example.com
trust_url=https://trust.stage.cascadeauth.dev
curl --fail --silent --show-error \
  "${trust_url}/.well-known/aac-root-keys/${tenant_id}"
curl --fail --silent --show-error \
  "${trust_url}/.well-known/spiffe-bundle/${trust_domain}"
```

The second check applies to the bundle role. Confirm the expected key IDs and
CA anchors. From an authenticated CLI profile on your administration host, inspect
the same tenant's history and records:

```bash
aac trust-anchor ingest-history --profile stage --output table
aac trust-anchor list --profile stage --output table
```

Both modes re-read public files on each poll and retry network/upload failures
with backoff. Already-published material remains available during an outage.
For key/CA rotation, follow the [publisher lifecycle procedures](https://pypi.org/project/aac-trust-anchor-publisher/)
and [keys and certificates](https://docs.cascadeauth.com/overview/keys-and-certificates/); keep the required
overlap, then restart the host service or recreate the container as described
in its own operating section.
