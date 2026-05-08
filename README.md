# Open Memory Archive

[![CI](https://github.com/memory-commons/open-memory-archive/actions/workflows/ci.yml/badge.svg)](https://github.com/memory-commons/open-memory-archive/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](https://github.com/memory-commons/open-memory-archive/blob/main/LICENSE)
[![Node.js 20+](https://img.shields.io/badge/node-%3E%3D20-brightgreen.svg)](https://nodejs.org/)
[![Zero runtime dependencies](https://img.shields.io/badge/dependencies-zero-brightgreen.svg)](#)
[![No telemetry](https://img.shields.io/badge/telemetry-none-brightgreen.svg)](#)
[![Works offline](https://img.shields.io/badge/works-offline-blue.svg)](#)

Open Memory Archive is an offline-first archive format, builder, validator, and static viewer for personal and community memory projects.

The project exists to make memory archives portable. A family, researcher, local cultural organisation, or self-hosted service should be able to create a self-contained archive that can be opened without an account, proprietary backend, signed URLs, telemetry, or external AI service.

## Origins

Open Memory Archive began as the data export and preservation layer of [OmaMemoirs](https://www.omamemoirs.fi), a memoir platform. It has been extracted and published as an independent specification and toolkit. It does not require OmaMemoirs infrastructure and is designed to be adopted by any platform, researcher, or local archive organisation.

## Status

v0.1.0 — first public release. The archive format, builder, validator, redaction layer, and static offline viewer are working. Download the [latest release](https://github.com/memory-commons/open-memory-archive/releases/latest) to try the demo archives without cloning.

## What It Produces

Running the builder on the `community-memory` example produces an offline archive folder:

```text
dist/community-memory/
├── index.html          ← open in any browser, no internet needed
├── manifest.json       ← machine-readable: format, privacy summary, checksums
├── data/
│   ├── archive.json    ← structured data: chapters, people, events, locations, media
│   └── checksums.sha256
└── media/
    └── media-note.txt
```

`index.html` opens directly in a browser. It shows chapters, people, events, and locations. Items marked private are shown as redacted placeholders — the private content is never written into the archive.

`manifest.json` always includes:

```json
{
  "externalNetworkRequired": false,
  "telemetryEnabled": false,
  "redactionCount": 3
}
```

<!-- TODO: add screenshot of index.html opened in browser -->
<!-- TODO: add screenshot of manifest.json privacy summary -->

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
node src/cli.js verify-checksums dist/redacted-family
node src/cli.js inspect-privacy dist/redacted-family
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
- `verify-checksums` reports that generated files match the checksum manifest
- `inspect-privacy` prints the privacy summary and redaction list

## File-based Archives

The `community-memory` example starts from ordinary files:

```text
examples/community-memory/
  memory.json
  chapters/
    harbour.md
    school.md
  data/
    people.csv
    events.csv
    locations.csv
    media.csv
  media/
    harbour-note.txt
```

Build it directly:

```bash
npm run build:community
node src/cli.js verify-checksums dist/community-memory
node src/cli.js inspect-privacy dist/community-memory
```

Open:

```text
dist/community-memory/index.html
```

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

## Why It Matters

Many personal-history and community-archive tools leave users dependent on a hosted product, expiring media URLs, account access, or undocumented exports. Open Memory Archive focuses on the exit path: producing a readable and machine-readable archive that can survive outside the original platform.

The project includes a versioned archive input format, a local builder, schema validation, deterministic privacy redaction, and a static offline viewer. It is not a hosted service or a complete GDPR compliance system; it is a portable archive tool that still leaves legal basis, consent collection, and data-controller duties with the organisations using it.

The first release is small by design. The goal is to verify the full portability loop end to end:

```text
structured memory data + local media
  -> validation
  -> privacy/redaction policy
  -> static offline archive
  -> checksums
  -> no-network viewer
```

### Who uses it

- **A local history group** collects interview notes, old photographs, and event records into a portable archive it can pass to a public library.
- **A family** records a grandparent's stories across several chapters, with living relatives redacted in the public version and full detail preserved in the family-only version.
- **An oral history researcher** exports a project archive that can be verified, cited, and reopened a decade later without any hosted service.
- **Any self-hosted platform** can adopt the format as its export layer so users are never locked in.

## Privacy By Default

Every entity in an archive carries a `privacy` field. The builder reads these fields and applies a redaction policy before writing the output.

In `public-demo` mode:

| Input | Output |
|-------|--------|
| Living person with unknown consent | Replaced with `"Redacted person"` placeholder |
| Event with `consentStatus: withdrawn` | Removed, recorded in redaction log |
| Exact birth date of living person | Generalised to year range or removed |
| Private media file | Not copied into archive |
| Signed URL or private storage path | Stripped |

The redaction log is written into `data/archive.json` and summarised in `manifest.json`. You can inspect it:

```bash
node src/cli.js inspect-privacy dist/redacted-family
```

The tool does not make legal decisions. Operators remain responsible for lawful basis, consent collection, and data subject requests. See [PRIVACY.md](./PRIVACY.md) and [DATA_PROTECTION.md](./DATA_PROTECTION.md).

## Privacy Properties

The builder runs entirely locally and makes no external network calls. It writes privacy metadata into `manifest.json` and applies redaction in `public-demo` mode by default. There is no telemetry, no signed URL generation, and no dependency on OpenAI, Supabase, Runpod, or any proprietary backend.

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

JSON Schema files are published in:

```text
schema/archive-input-v1.schema.json
schema/archive-manifest-v1.schema.json
```

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
