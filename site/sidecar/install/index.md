Canonical: https://docs.cascadeauth.com/sidecar/install/

Applies to: AAC Sidecar v0.5.2

Documentation revision: 977d8fbadfc4630d2d8b5e4166cb827458196919

---

# Download and install the sidecar

Get the AAC Sidecar container from
[Docker Hub](https://hub.docker.com/r/cascadeauth/aac-sidecar/). The repository
page includes the image tags, pull instructions and the public operating guide.
Use a released version, then choose how to run it beside your agent.

```bash
docker pull docker.io/cascadeauth/aac-sidecar:v0.5.2
docker run --rm docker.io/cascadeauth/aac-sidecar:v0.5.2 -version
```

The version command confirms the downloaded executable; it does not start a
configured sidecar. Next, follow one of these paths:

- **First AAC example:** [start the AAC journey](https://docs.cascadeauth.com/get-started/). Docker Compose
  runs both agents, their sidecars and trust anchor publishers.
- **Your existing agent environment:** [prepare the configuration and place the
  sidecar beside your workload](https://docs.cascadeauth.com/sidecar/configuration/#advanced-installation-guide-container).
  Use the [CLI guide](https://docs.cascadeauth.com/cli/guide/) to prepare tenant and agent material.
- **A host process instead of a container:** install the standalone binary below.

## Standalone binary for Linux or macOS

The same Docker Hub repository distributes a bundle containing binaries for
`linux_amd64`, `linux_arm64`, `darwin_amd64` and `darwin_arm64`, with the
configuration template, license and operating documentation.
[Install ORAS](https://oras.land/docs/installation/) to download the bundle:

```bash
mkdir aac-sidecar-v0.5.2
cd aac-sidecar-v0.5.2
oras pull docker.io/cascadeauth/aac-sidecar:v0.5.2-bundle
```

Choose the archive matching your operating system and CPU. On Ubuntu, if
`uname -m` returns `aarch64`, select `linux_arm64`; Apple Silicon uses
`darwin_arm64`. If you need to check signatures or checksums before extraction,
use the [release verification procedure](https://docs.cascadeauth.com/sidecar/reference/verification/#verify-the-standalone-bundle).

```bash
version=v0.5.2
platform=linux_amd64  # choose the matching platform listed above
install_root="${HOME}/.local/lib/aac-sidecar/releases/${version}"

mkdir -p "${install_root}" "${HOME}/.local/bin"
tar -xzf "aac-sidecar_${version}_${platform}.tar.gz" -C "${install_root}"
ln -sfn "${install_root}/aac-sidecar" "${HOME}/.local/bin/aac-sidecar"
"${HOME}/.local/bin/aac-sidecar" -version
```

Run the executable with the configuration prepared for your agent:

```bash
"${HOME}/.local/bin/aac-sidecar" -config /absolute/path/to/sidecar-config.yaml
```

The sidecar and agent must share their loopback network environment, and the
configured credentials, trust material and state paths must be available.
[Configure for your environment](https://docs.cascadeauth.com/sidecar/configuration/) and
[operate the sidecar](https://docs.cascadeauth.com/sidecar/operations/) explain these requirements and
readiness checks. A managed service runs as a dedicated non-root account;
a developer installation can stay under your home directory.
An operator-managed installation under `/opt/aac/sidecar/releases/<version>`
may be root-owned, but its service process must still run as the non-root
account. Keep developer installations in a user-writable directory.

## Other AAC components

The [installation hub](https://docs.cascadeauth.com/) connects the rest of the stack:
[AAC CLI on PyPI](https://pypi.org/project/aac-cli/),
[trust anchor publisher on PyPI](https://pypi.org/project/aac-trust-anchor-publisher/)
or [GHCR](https://github.com/orgs/CascadeAuth/packages/container/package/aac-trust-anchor-publisher),
and [aac-invoke-auth on PyPI](https://pypi.org/project/aac-invoke-auth/).
Each package page includes its installation and usage documentation.

For an additional audit, see [artifact signatures, checksums and provenance](https://docs.cascadeauth.com/sidecar/reference/verification/).
