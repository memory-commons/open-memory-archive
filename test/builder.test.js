import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { buildArchive } from '../src/builder.js'

test('builder creates an offline archive directory with privacy summary', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'oma-test-'))
  try {
    const result = await buildArchive({
      inputPath: 'examples/redacted-family/archive.json',
      outputPath: outDir,
      privacyProfile: 'public-demo',
      now: '2026-05-05T12:00:00Z',
    })

    const manifest = JSON.parse(await readFile(join(result.archiveDir, 'manifest.json'), 'utf-8'))
    const archive = JSON.parse(await readFile(join(result.archiveDir, 'data/archive.json'), 'utf-8'))
    const html = await readFile(join(result.archiveDir, 'index.html'), 'utf-8')
    const checksums = await readFile(join(result.archiveDir, 'data/checksums.sha256'), 'utf-8')

    assert.equal(manifest.privacy.externalNetworkRequired, false)
    assert.equal(manifest.privacy.telemetryEnabled, false)
    assert.ok(manifest.privacy.redactionCount > 0)
    assert.equal(archive.media.find((item) => item.id === 'media-private').localPath, undefined)
    assert.doesNotMatch(JSON.stringify(archive), /signature=synthetic/)
    assert.doesNotMatch(JSON.stringify(archive), /Private family recording/)
    assert.doesNotMatch(JSON.stringify(archive), /Private detail/)
    assert.match(html, /Redacted Family Archive Demo/)
    assert.match(checksums, /manifest\.json/)
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
})
