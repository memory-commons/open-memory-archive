# Demo Walkthrough

This walkthrough shows the current value of Open Memory Archive in a few minutes.

## 1. Run Tests

```bash
npm test
```

Expected result:

```text
# pass 2
# fail 0
```

## 2. Build A Redacted Archive

```bash
npm run build:redacted
```

Expected output:

```text
Archive built: .../dist/redacted-family
Privacy profile: public-demo
Contains personal data: true
Contains living person data: false
Redactions applied: 4
External network required: false
Telemetry enabled: false
```

## 3. Inspect The Output

Open:

```text
dist/redacted-family/index.html
```

Inspect:

```text
dist/redacted-family/manifest.json
dist/redacted-family/data/archive.json
dist/redacted-family/data/checksums.sha256
```

The private fixture contains a living-person name, exact birth date, exact address, email, private event, private media item, and a synthetic signed URL. The generated archive should not expose those fields in public-demo mode.

## 4. Why This Demonstrates Value

The demo proves that the archive does not need the original web app, account system, storage bucket, or signed media URLs. A user can receive a directory or zip and still read the archive offline.

This is the minimum useful commons contribution:

- a documented interchange shape
- a validator
- a local builder
- a privacy-aware export path
- a static viewer
- checksums for integrity inspection

## 5. Current Limits

This is not yet a complete archive ecosystem. Missing pieces include JSON Schema files, better viewer UX, zip-output tests, an `inspect-privacy` command, richer graph rendering, and import adapters from existing systems.
