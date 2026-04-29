# Contributing

Contributions are welcome when they improve portability, privacy, accessibility, documentation, tests, or archive interoperability.

## Principles

The core builder should stay independent from proprietary services. OpenAI, Runpod, Supabase Cloud, and other SaaS providers must not become required for normal use.

The project should not add telemetry, and fixtures must not contain customer data or real family materials. Use synthetic examples that are safe to publish and easy for reviewers to inspect.

Prefer deterministic output over hidden behaviour. Archive files, privacy metadata, redaction records, and checksums should be understandable from the repository without access to a hosted service.

## Development

Run tests before submitting changes:

```bash
npm test
```

## License

By contributing, you agree that your contribution is licensed under Apache-2.0.
