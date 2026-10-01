# Install standalone binaries and verify artifacts

[Start with the Docker journey](https://cascadeauth.github.io/aac-starter-guide/) · [All references](https://cascadeauth.github.io/aac-starter-guide/references.html)

This reference is for a deployment or integration you have chosen to configure.
For the first authenticated reservation, use the packaged Compose journey above.

## Verify a container or audit artifacts — optional

Install Docker and Cosign. Verify the
published digest against CascadeAuth's GitHub Actions keyless identity:

```bash
set -euo pipefail
export AAC_SIDECAR_VERSION=v0.4.4
export AAC_SIDECAR_IMAGE=docker.io/cascadeauth/aac-sidecar
export AAC_SIDECAR_DIGEST="$(
  docker buildx imagetools inspect "${AAC_SIDECAR_IMAGE}:${AAC_SIDECAR_VERSION}" |
    awk '$1 == "Digest:" { print $2; exit }'
)"
[[ "${AAC_SIDECAR_DIGEST}" =~ ^sha256:[0-9a-f]{64}$ ]]

cosign verify \
  --certificate-identity 'https://github.com/CascadeAuth/aac-sidecar-go/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  "${AAC_SIDECAR_IMAGE}@${AAC_SIDECAR_DIGEST}"

docker pull "${AAC_SIDECAR_IMAGE}@${AAC_SIDECAR_DIGEST}"
docker image inspect "${AAC_SIDECAR_IMAGE}@${AAC_SIDECAR_DIGEST}" \
  --format '{{index .Config.Labels "org.opencontainers.image.version"}} {{index .Config.Labels "org.opencontainers.image.licenses"}}'
```

The final line must print:

```text
v0.4.4 LicenseRef-AAC-Sidecar-Developer-Beta-1.0
```

## Alternative standalone-binary installation with ORAS

Use this alternative to the sidecar container for a bare VM, systemd host,
or macOS development machine. Container users can also download the bundle
for offline documentation or deep audit without installing its standalone binary.
[Install ORAS](https://oras.land/docs/installation/) to download the files and
[install Cosign](https://docs.sigstore.dev/cosign/system_config/installation/) to
verify their signatures. Neither tool is needed to run the sidecar afterward.

```bash
mkdir aac-sidecar-v0.4.4
cd aac-sidecar-v0.4.4
bundle_ref=docker.io/cascadeauth/aac-sidecar:v0.4.4-bundle
bundle_digest="$(oras resolve "${bundle_ref}")"
[[ "${bundle_digest}" =~ ^sha256:[0-9a-f]{64}$ ]]

cosign verify \
  --certificate-identity 'https://github.com/CascadeAuth/aac-sidecar-go/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  "docker.io/cascadeauth/aac-sidecar@${bundle_digest}"

oras pull "docker.io/cascadeauth/aac-sidecar@${bundle_digest}"

cosign verify-blob \
  --certificate-identity 'https://github.com/CascadeAuth/aac-sidecar-go/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle checksums.txt.bundle \
  checksums.txt

bash ./verify-developer-beta.sh . v0.4.4
```

### Install the verified standalone binary

Select only the archive for the current platform. Default developer install:

```bash
version=v0.4.4
platform=linux_amd64  # or linux_arm64, darwin_amd64, darwin_arm64
install_root="${HOME}/.local/lib/aac-sidecar/releases/${version}"

mkdir -p "${install_root}" "${HOME}/.local/bin"
tar -xzf "aac-sidecar_${version}_${platform}.tar.gz" -C "${install_root}"
ln -sfn "${install_root}/aac-sidecar" "${HOME}/.local/bin/aac-sidecar"
"${HOME}/.local/bin/aac-sidecar" -version
```

For an Ubuntu ARM64 VM (`uname -m` returns `aarch64`), select `linux_arm64`,
not the `linux_amd64` default in the example. Install Cosign and ORAS in the
verification environment before this standalone path; the container path also
uses Docker's Buildx plugin for digest inspection. Do not overwrite an existing
installation or delete unrelated services to make the destination appear clean.

For an operator-managed production service, `/opt/aac/sidecar/releases/<version>`
may be root-owned, but the service process itself must run as a dedicated
non-root account. Do not default a developer install to a root-owned directory.

### Optional deep artifact audit

For a reproducible audit beyond signature/checksum verification, install
Python 3.11+ and Go, then run
this **after** the Cosign verification above:

```bash
python3 --version
go version
bash ./verify-developer-beta.sh . v0.4.4 --deep-audit
```

Go reads embedded build metadata from each binary; it does not execute foreign-platform
binaries. The verifier's final version check executes only your host's binary.
The optional audit checks:

- All four platform archives, exact file sets and matching license/notices/guide.
- Binary platform, Go build metadata, version/commit, `-trimpath` and disabled
  CGO; Linux ELF symbol/debug-section absence and private-source/key markers.
- The OCI archive's two Linux platforms, complete referenced SHA-256 blob graph,
  descriptor lengths, runtime user/entrypoint, release labels, legal files and
  application-layer file set; every layer is scanned for forbidden source/key
  markers without extracting it into your filesystem.
- SPDX 2.3 identifiers/relationships and its four binary SHA-256 values against
  the standalone archives.
- in-toto/SLSA version, commit, targets, builder/tool identity and every public
  subject digest against the signed checksum manifest.

It prints a JSON audit summary with the binary hashes and inventory counts.
Archive bounds fail closed if an input exceeds the supported release profile.
The audit verifies the signed build metadata and artifact contents; it does
not reproduce the build. A green audit does not replace
Cosign identity verification, runtime readiness, or your tenant's qualification.
