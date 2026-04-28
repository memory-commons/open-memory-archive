import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'

import { ARCHIVE_INPUT_FORMAT } from './schema.js'

function parseBoolean(value) {
  if (value === undefined || value === null || value === '') return undefined
  return ['true', '1', 'yes', 'y'].includes(String(value).trim().toLowerCase())
}

function parseCsvLine(line) {
  const cells = []
  let cell = ''
  let quoted = false

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    const next = line[index + 1]
    if (char === '"' && quoted && next === '"') {
      cell += '"'
      index += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      cells.push(cell)
      cell = ''
    } else {
      cell += char
    }
  }

  cells.push(cell)
  return cells.map((value) => value.trim())
}

function parseCsv(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))

  if (lines.length === 0) return []
  const headers = parseCsvLine(lines[0])
  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? '']))
  })
}

function privacyFromRow(row, defaults = {}) {
  return {
    privacyScope: row.privacyScope || defaults.privacyScope || 'public',
    consentStatus: row.consentStatus || defaults.consentStatus || 'unknown',
    livingPersonStatus: row.livingPersonStatus || defaults.livingPersonStatus || 'unknown',
    containsPersonalData:
      parseBoolean(row.containsPersonalData) ?? defaults.containsPersonalData ?? false,
    containsSpecialCategoryData:
      parseBoolean(row.containsSpecialCategoryData) ?? defaults.containsSpecialCategoryData ?? false,
    legalBasisHint: row.legalBasisHint || defaults.legalBasisHint || 'unknown',
  }
}

async function loadCsv(projectDir, path) {
  if (!path) return []
  return parseCsv(await readFile(join(projectDir, path), 'utf-8'))
}

async function loadMarkdownSection(projectDir, chapter) {
  const text = await readFile(join(projectDir, chapter.file), 'utf-8')
  const title = chapter.title || text.match(/^#\s+(.+)$/m)?.[1] || chapter.id
  return {
    id: `${chapter.id}-body`,
    title,
    text: text.replace(/^#\s+.+\n+/, '').trim(),
    privacy: {
      privacyScope: chapter.privacyScope || 'public',
      consentStatus: chapter.consentStatus || 'not_required',
      livingPersonStatus: chapter.livingPersonStatus || 'not_applicable',
      containsPersonalData: Boolean(chapter.containsPersonalData),
      containsSpecialCategoryData: Boolean(chapter.containsSpecialCategoryData),
    },
  }
}

export async function importFolder(inputDir, options = {}) {
  const projectDir = resolve(inputDir)
  const manifestPath = join(projectDir, options.manifest ?? 'memory.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'))

  const peopleRows = await loadCsv(projectDir, manifest.peopleCsv)
  const eventRows = await loadCsv(projectDir, manifest.eventsCsv)
  const locationRows = await loadCsv(projectDir, manifest.locationsCsv)
  const mediaRows = await loadCsv(projectDir, manifest.mediaCsv)

  const chapters = []
  for (const chapter of manifest.chapters ?? []) {
    chapters.push({
      id: chapter.id,
      title: chapter.title,
      privacy: {
        privacyScope: chapter.privacyScope || 'public',
        consentStatus: chapter.consentStatus || 'not_required',
        livingPersonStatus: chapter.livingPersonStatus || 'not_applicable',
        containsPersonalData: Boolean(chapter.containsPersonalData),
        containsSpecialCategoryData: Boolean(chapter.containsSpecialCategoryData),
      },
      sections: [await loadMarkdownSection(projectDir, chapter)],
    })
  }

  return {
    format: ARCHIVE_INPUT_FORMAT,
    publication: {
      id: manifest.id,
      title: manifest.title,
      author: manifest.author ?? null,
      locale: manifest.locale ?? 'en',
      privacy: {
        privacyScope: manifest.privacyScope || 'public',
        consentStatus: manifest.consentStatus || 'not_required',
        livingPersonStatus: manifest.livingPersonStatus || 'not_applicable',
        containsPersonalData: Boolean(manifest.containsPersonalData),
        containsSpecialCategoryData: Boolean(manifest.containsSpecialCategoryData),
      },
    },
    chapters,
    people: peopleRows.map((row) => ({
      id: row.id,
      displayName: row.displayName || row.name,
      description: row.description || '',
      privacy: privacyFromRow(row, { containsPersonalData: true }),
    })),
    events: eventRows.map((row) => ({
      id: row.id,
      title: row.title,
      date: row.date || '',
      description: row.description || '',
      privacy: privacyFromRow(row),
    })),
    locations: locationRows.map((row) => ({
      id: row.id,
      name: row.name,
      region: row.region || '',
      country: row.country || '',
      privacy: privacyFromRow(row),
    })),
    media: mediaRows.map((row) => ({
      id: row.id,
      title: row.title || row.id,
      sourcePath: row.file || row.sourcePath,
      mediaType: row.mediaType || null,
      privacy: privacyFromRow(row),
    })),
    relationships: manifest.relationships ?? [],
    extensions: manifest.extensions ?? {},
  }
}

export async function writeImportedArchiveInput(inputDir, outputPath, options = {}) {
  const archiveInput = await importFolder(inputDir, options)
  const resolvedOutput = resolve(outputPath)
  await writeFile(resolvedOutput, `${JSON.stringify(archiveInput, null, 2)}\n`, 'utf-8')
  return {
    archiveInput,
    outputPath: resolvedOutput,
    outputDir: dirname(resolvedOutput),
  }
}
