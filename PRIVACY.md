# Privacy

Open Memory Archive is designed for local archive generation and offline viewing.

## What The Tool Processes

The builder processes archive input JSON and optional local media files supplied by the operator. Depending on the input, this may include names, life events, places, media metadata, and other personal or family history material.

## What The Tool Does Not Collect

The tool does not:

- send archive data to external APIs
- require a cloud account
- require OpenAI, Runpod, Supabase, or any proprietary backend
- add analytics
- add telemetry
- set cookies
- set localStorage in the default viewer
- generate signed URLs

## Redaction

The default `public-demo` privacy profile applies conservative redaction:

- private records are replaced with placeholders
- family-only records are redacted in public demo output
- withdrawn consent removes records from the public view
- living-person sensitive fields are removed or generalized
- private storage paths and signed URLs are stripped

Every redaction is recorded in `data/archive.json` under `redactions`, and the generated `manifest.json` includes a privacy summary.

## Correction And Withdrawal

If source material is corrected or consent is withdrawn, regenerate the archive from corrected source input. Previously generated archives should be replaced or deleted by the operator.

This tool cannot retract copies that have already been shared by other parties.

## Limits

This tool helps create portable archives with privacy metadata and deterministic redaction. It is not a complete GDPR compliance system. Operators remain responsible for choosing a lawful basis, handling data subject requests, and ensuring that source materials may be exported.

