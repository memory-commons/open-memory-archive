# Open Memory Archive

Open Memory Archive is an offline-first archive format, builder, validator, and static viewer for personal and community memory projects.

The project exists to make memory archives portable. A family, researcher, local cultural organisation, or self-hosted service should be able to create a self-contained archive that can be opened without an account, proprietary backend, signed URLs, telemetry, or external AI service.

## Status

Early public extraction. The current release is intended to demonstrate the archive format, privacy metadata, deterministic redaction, and a local builder/viewer workflow.

## Quick Start

Requirements:

- Node.js 20 or newer
- `zip` command if you want `.zip` output

Clone and run:

```bash
git clone git@github.com:memory-commons/open-memory-archive.git
cd open-memory-archive
npm test
npm run build:redacted
```

Open:

```text
dist/redacted-family/index.html
```

What to check:

- the archive opens without a server
- `manifest.json` says `externalNetworkRequired: false`
- `manifest.json` says `telemetryEnabled: false`
- the private fixture media file is not copied into the archive
- living-person and withdrawn-consent fixture details are replaced by redacted placeholders
- `data/checksums.sha256` lists the generated files

Validate an example:

```bash
node src/cli.js validate examples/minimal-public/archive.json
```

Build an offline archive directory:

```bash
node src/cli.js build examples/minimal-public/archive.json --out dist/minimal-public
```

Build a redacted public demo:

```bash
node src/cli.js build examples/redacted-family/archive.json --privacy-profile public-demo --out dist/redacted-family
```

Then open:

```text
dist/redacted-family/index.html
```

The viewer is static HTML with embedded archive data. It does not require a server.

## What This Is

- A versioned archive input format.
- A local builder that writes static archive files.
- A validator for archive inputs and manifests.
- A deterministic privacy/redaction layer.
- A static offline viewer.

## Why It Matters

Many personal-history and community-archive tools leave users dependent on a hosted product, expiring media URLs, account access, or undocumented exports. Open Memory Archive focuses on the exit path: producing a readable and machine-readable archive that can survive outside the original platform.

The first demo is intentionally small. Its value is that it proves the core portability loop:

```text
structured memory data + local media
  -> validation
  -> privacy/redaction policy
  -> static offline archive
  -> checksums
  -> no-network viewer
```

## What This Is Not

- Not a hosted SaaS.
- Not a complete GDPR compliance system.
- Not a consent management platform.
- Not a replacement for a data controller's legal obligations.
- Not tied to OmaMemoirs Oy infrastructure.

## Privacy Properties

The builder:

- runs locally
- does not send data to external APIs
- does not require OpenAI, Runpod, Supabase, or any proprietary backend
- does not generate signed URLs
- does not add telemetry
- writes privacy metadata into `manifest.json`
- applies redaction by default in `public-demo` mode

See [PRIVACY.md](./PRIVACY.md) and [DATA_PROTECTION.md](./DATA_PROTECTION.md).

## Archive Contents

A built archive contains:

```text
index.html
manifest.json
data/archive.json
data/checksums.sha256
media/
```

`index.html` is the human-readable viewer. `data/archive.json` and `manifest.json` are machine-readable.

## Format

The initial input format is `open-memory-archive-input-v1`. The generated archive format is `open-memory-archive-v1`.

The stable core entities are:

- publication
- chapters
- sections
- people
- events
- locations
- media
- relationships
- redactions
- privacy summary

See [docs/format-v1.md](./docs/format-v1.md).

## Development

Run tests:

```bash
npm test
```

The package has no runtime npm dependencies.

## License

Apache-2.0. See [LICENSE](./LICENSE).
