import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { buildArchive } from '../src/builder.js'
import { verifyChecksums } from '../src/checksum.js'
import { inspectPrivacy } from '../src/inspect.js'

test('verifyChecksums validates generated archive files', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'oma-checksum-'))
  try {
    await buildArchive({
      inputPath: 'examples/redacted-family/archive.json',
      outputPath: outDir,
      privacyProfile: 'public-demo',
      now: '2026-05-05T12:00:00Z',
    })

    const result = await verifyChecksums(outDir)
    assert.equal(result.ok, true)
    assert.ok(result.checked > 0)
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
})

test('verifyChecksums reports tampered files', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'oma-checksum-'))
  try {
    await buildArchive({
      inputPath: 'examples/minimal-public/archive.json',
      outputPath: outDir,
      privacyProfile: 'public-demo',
      now: '2026-05-05T12:00:00Z',
    })

    const archivePath = join(outDir, 'data/archive.json')
    const original = await readFile(archivePath, 'utf-8')
    await writeFile(archivePath, original.replace('A Small Public Memory Archive', 'Tampered'))

    const result = await verifyChecksums(outDir)
    assert.equal(result.ok, false)
    assert.ok(result.failures.some((failure) => failure.path === 'data/archive.json'))
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
})

test('inspectPrivacy reads manifest privacy summary and redactions', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'oma-inspect-'))
  try {
    await buildArchive({
      inputPath: 'examples/redacted-family/archive.json',
      outputPath: outDir,
      privacyProfile: 'public-demo',
      now: '2026-05-05T12:00:00Z',
    })

    const inspection = await inspectPrivacy(outDir)
    assert.equal(inspection.privacy.externalNetworkRequired, false)
    assert.equal(inspection.privacy.telemetryEnabled, false)
    assert.equal(inspection.privacy.containsLivingPersonData, false)
    assert.ok(inspection.redactions.length > 0)
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
})
