# Data Protection Notes

This document explains the data protection model for Open Memory Archive. It is engineering documentation, not legal advice.

## Roles

In a self-hosted or local workflow, the operator deciding what data to export is typically the controller. Open Memory Archive is local software that processes the operator's supplied files.

If a hosted service wraps this tool for others, that service may have additional controller or processor obligations.

## Data Flow

```text
archive input JSON + local media
  -> validation
  -> privacy/redaction policy
  -> static archive directory
  -> optional zip
  -> offline viewer
```

The default workflow does not require network access.

## Data Categories

Potential data categories:

- publication metadata
- chapter and section text
- people
- events
- locations
- media metadata
- local media files
- privacy metadata
- redaction records

The tool can process personal data if the input identifies living individuals.

## Privacy Controls

The archive format supports:

- `privacyScope`
- `consentStatus`
- `livingPersonStatus`
- `containsPersonalData`
- `containsSpecialCategoryData`
- `legalBasisHint`
- redaction records
- manifest privacy summary

`legalBasisHint` is only a hint from the source system. The tool does not determine legal basis.

## Retention

The builder writes output to the path chosen by the operator. Retention and deletion of built archives are the operator's responsibility.

## Data Subject Requests

The current tool does not provide a request portal. For access, rectification, erasure, objection, or withdrawal workflows, operators should update the source material and regenerate archives.

## Security Considerations

- Do not include real personal data in public fixtures.
- Inspect generated archives before publication.
- Avoid remote URLs in archive data.
- Avoid signed URLs entirely.
- Store archives according to the sensitivity of their content.

## Known Limitations

- No full consent ledger.
- No automated DPIA.
- No legal basis engine.
- No account deletion workflow.
- No remote revocation after an archive has been copied.

