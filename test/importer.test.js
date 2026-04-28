import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'

import { buildArchive } from '../src/builder.js'
import { importFolder, writeImportedArchiveInput } from '../src/importer.js'

test('importFolder converts community-memory folder into archive input', async () => {
  const archiveInput = await importFolder('examples/community-memory')

  assert.equal(archiveInput.format, 'open-memory-archive-input-v1')
  assert.equal(archiveInput.publication.title, 'Harbour Street Community Memories')
  assert.equal(archiveInput.chapters.length, 2)
  assert.equal(archiveInput.people.length, 2)
  assert.equal(archiveInput.events.length, 2)
  assert.equal(archiveInput.media.length, 2)
  assert.match(archiveInput.chapters[0].sections[0].text, /ordinary Markdown/)
})

test('writeImportedArchiveInput output can be built into a redacted archive', async () => {
  const outDir = await mkdtemp(join(tmpdir(), 'oma-community-'))
  try {
    const inputPath = join(outDir, 'archive.json')
    await writeImportedArchiveInput('examples/community-memory', inputPath)
    const result = await buildArchive({
      inputPath,
      inputBaseDir: 'examples/community-memory',
      outputPath: join(outDir, 'archive'),
      privacyProfile: 'public-demo',
      now: '2026-05-05T12:00:00Z',
    })

    const archive = JSON.parse(await readFile(join(result.archiveDir, 'data/archive.json'), 'utf-8'))
    assert.equal(archive.publication.title, 'Harbour Street Community Memories')
    assert.equal(archive.people.find((person) => person.id === 'person-anna').redacted, true)
    assert.equal(archive.media.find((media) => media.id === 'media-note').missing, undefined)
    assert.equal(archive.media.find((media) => media.id === 'media-note').localPath, 'media/media-note.txt')
    assert.equal(archive.media.find((media) => media.id === 'media-private').localPath, undefined)
  } finally {
    await rm(outDir, { recursive: true, force: true })
  }
})
