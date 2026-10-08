Canonical: https://docs.cascadeauth.com/sidecar/reference/verification/

Applies to: AAC Sidecar v0.5.2

Documentation revision: 977d8fbadfc4630d2d8b5e4166cb827458196919

---

# Verify release artifacts

Use these optional checks when your deployment policy calls for signature,
checksum or build-provenance verification. For ordinary installation, start
with [Download and install the sidecar](https://docs.cascadeauth.com/sidecar/install/).

## Verify the sidecar container


Install Docker and Cosign. Verify the
published digest against CascadeAuth's GitHub Actions keyless identity:

```bash
set -euo pipefail
export AAC_SIDECAR_VERSION=v0.5.2
export AAC_SIDECAR_IMAGE=docker.io/cascadeauth/aac-sidecar
export AAC_SIDECAR_DIGEST="$(
  docker buildx imagetools inspect "${AAC_SIDECAR_IMAGE}:${AAC_SIDECAR_VERSION}" |
    awk '$1 == "Digest:" { print $2; exit }'
)"
[[ "${AAC_SIDECAR_DIGEST}" =~ ^sha256:[0-9a-f]{64}$ ]]

cosign verify \
  --certificate-identity \
    'https://github.com/CascadeAuth/aac-sidecar-go/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  "${AAC_SIDECAR_IMAGE}@${AAC_SIDECAR_DIGEST}"

docker pull "${AAC_SIDECAR_IMAGE}@${AAC_SIDECAR_DIGEST}"
image_labels_format='{{index .Config.Labels "org.opencontainers.image.version"}} '
image_labels_format+='{{index .Config.Labels "org.opencontainers.image.licenses"}}'
docker image inspect "${AAC_SIDECAR_IMAGE}@${AAC_SIDECAR_DIGEST}" \
  --format "$image_labels_format"
```

The final line must print:

```text
v0.5.2 LicenseRef-AAC-Sidecar-Developer-Beta-1.0
```

## Verify the standalone bundle


Use this alternative to the sidecar container for a bare VM, systemd host,
or macOS development machine. Container users can also download the bundle
for offline documentation or deep audit without installing its standalone binary.
[Install ORAS](https://oras.land/docs/installation/) to download the files and
[install Cosign](https://docs.sigstore.dev/cosign/system_config/installation/) to
verify their signatures. Neither tool is needed to run the sidecar afterward.

```bash
mkdir aac-sidecar-v0.5.2
cd aac-sidecar-v0.5.2
bundle_ref=docker.io/cascadeauth/aac-sidecar:v0.5.2-bundle
bundle_digest="$(oras resolve "${bundle_ref}")"
[[ "${bundle_digest}" =~ ^sha256:[0-9a-f]{64}$ ]]

cosign verify \
  --certificate-identity \
    'https://github.com/CascadeAuth/aac-sidecar-go/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  "docker.io/cascadeauth/aac-sidecar@${bundle_digest}"

oras pull "docker.io/cascadeauth/aac-sidecar@${bundle_digest}"

cosign verify-blob \
  --certificate-identity \
    'https://github.com/CascadeAuth/aac-sidecar-go/.github/workflows/release.yml@refs/heads/main' \
  --certificate-oidc-issuer 'https://token.actions.githubusercontent.com' \
  --bundle checksums.txt.bundle \
  checksums.txt

bash ./verify-developer-beta.sh . v0.5.2
```

## Deep artifact audit


For a reproducible audit beyond signature/checksum verification, install
Python 3.11+ and Go, then run
this **after** the Cosign verification above:

```bash
python3 --version
go version
bash ./verify-developer-beta.sh . v0.5.2 --deep-audit
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
