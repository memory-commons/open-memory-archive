# Open Memory Archive Format v1

## Input Format

Archive inputs use:

```json
{
  "format": "open-memory-archive-input-v1"
}
```

The core input entities are:

- `publication`
- `chapters`
- `people`
- `events`
- `locations`
- `media`
- `relationships`

## Generated Archive Format

Generated archives use:

```json
{
  "format": "open-memory-archive-v1",
  "formatVersion": 1
}
```

A generated archive contains:

```text
index.html
manifest.json
data/archive.json
data/checksums.sha256
media/
```

## Privacy Metadata

Entities may include:

```json
{
  "privacy": {
    "privacyScope": "public",
    "consentStatus": "granted",
    "livingPersonStatus": "deceased",
    "containsPersonalData": true,
    "containsSpecialCategoryData": false,
    "legalBasisHint": "unknown"
  }
}
```

Allowed `privacyScope` values:

- `public`
- `family`
- `private`
- `research`
- `redacted`

Allowed `consentStatus` values:

- `granted`
- `withdrawn`
- `unknown`
- `not_applicable`
- `not_required`

Allowed `livingPersonStatus` values:

- `living`
- `deceased`
- `unknown`
- `organization`
- `fictional`
- `not_applicable`

## Redactions

Redactions are stored as records:

```json
{
  "path": "$.people[2].birthPlace",
  "reason": "living_person",
  "ruleId": "default-public-demo-v1",
  "appliedAt": "2026-05-05T12:00:00Z",
  "replacement": "generalized"
}
```

## Interoperability

The v1 format intentionally keeps the core small. Application-specific fields should be placed under `extensions`.
