import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { buildArchive } from '../src/builder.js'
import { verifyChecksums } from '../src/checksum.js'
import { writeImportedArchiveInput } from '../src/importer.js'

async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'ignore' })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} failed with exit code ${code}`))
    })
  })
}

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

test('builder creates a portable zip archive that can be extracted and verified', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'oma-zip-'))
  const extractDir = join(outDir, 'extracted')
  const inputPath = join(outDir, 'community-memory-input.json')
  const zipPath = join(outDir, 'community-memory.zip')

  try {
    await writeImportedArchiveInput('examples/community-memory', inputPath)

    const result = await buildArchive({
      inputPath,
      inputBaseDir: 'examples/community-memory',
      outputPath: zipPath,
      privacyProfile: 'public-demo',
      now: '2026-05-05T12:00:00Z',
    })

    assert.equal(result.archivePath, zipPath)
    assert.ok(result.sizeBytes > 0)
    assert.match(result.checksumSha256, /^[a-f0-9]{64}$/)

    await runCommand('unzip', ['-q', zipPath, '-d', extractDir])

    const manifest = JSON.parse(await readFile(join(extractDir, 'manifest.json'), 'utf-8'))
    const archive = JSON.parse(await readFile(join(extractDir, 'data/archive.json'), 'utf-8'))
    const verification = await verifyChecksums(extractDir)

    assert.equal(manifest.privacy.externalNetworkRequired, false)
    assert.equal(manifest.privacy.telemetryEnabled, false)
    assert.equal(archive.publication.title, 'Harbour Street Community Memories')
    assert.equal(verification.ok, true)
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
})
