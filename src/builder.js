import { spawn } from 'node:child_process'
import { constants } from 'node:fs'
import { access, copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'

import {
  ARCHIVE_FORMAT,
  ARCHIVE_FORMAT_VERSION,
  BUILDER_VERSION,
  validateArchiveInput,
} from './schema.js'
import { redactArchiveInput } from './privacy.js'
import { renderViewerHtml } from './viewer.js'
import { fileSizeBytes, sha256File, writeChecksumsFile } from './checksum.js'

function safeFileName(value) {
  return String(value ?? 'file')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'file'
}

function mediaExtension(media) {
  const fromPath = extname(media.sourcePath ?? media.localPath ?? '')
  if (fromPath && fromPath.length <= 12) return fromPath
  const type = String(media.mediaType ?? '').toLowerCase()
  if (type.includes('jpeg')) return '.jpg'
  if (type.includes('png')) return '.png'
  if (type.includes('webp')) return '.webp'
  if (type.includes('mp4')) return '.mp4'
  if (type.includes('mpeg')) return '.mp3'
  if (type.includes('wav')) return '.wav'
  if (type.includes('pdf')) return '.pdf'
  return ''
}

async function exists(filePath) {
  try {
    await access(filePath, constants.R_OK)
    return true
  } catch {
    return false
  }
}

async function copyMediaFiles(input, inputDir, archiveDir) {
  const copied = []
  const seen = new Set()
  await mkdir(join(archiveDir, 'media'), { recursive: true })

  for (const media of input.media ?? []) {
    if (media.redacted) {
      copied.push(media)
      continue
    }

    const sourcePath = media.sourcePath ?? media.localPath
    if (!sourcePath) {
      copied.push(media)
      continue
    }
    const resolvedSource = resolve(inputDir, sourcePath)
    if (!(await exists(resolvedSource))) {
      copied.push({ ...media, missing: true })
      continue
    }

    const baseName = safeFileName(media.id ?? basename(sourcePath))
    const ext = mediaExtension(media)
    let localPath = `media/${baseName}${ext}`
    let suffix = 2
    while (seen.has(localPath)) {
      localPath = `media/${baseName}-${suffix}${ext}`
      suffix += 1
    }
    seen.add(localPath)
    await copyFile(resolvedSource, join(archiveDir, localPath))
    copied.push({ ...media, localPath, sourcePath: undefined })
  }

  return copied
}

function buildManifest(archiveData, options) {
  return {
    format: ARCHIVE_FORMAT,
    formatVersion: ARCHIVE_FORMAT_VERSION,
    builderVersion: BUILDER_VERSION,
    generatedAt: options.now ?? new Date().toISOString(),
    publication: {
      id: archiveData.publication?.id ?? null,
      title: archiveData.publication?.title ?? null,
      locale: archiveData.publication?.locale ?? null,
    },
    privacy: archiveData.privacySummary,
    files: {
      data: 'data/archive.json',
      checksums: 'data/checksums.sha256',
      viewer: 'index.html',
    },
  }
}

async function zipDirectory(sourceDir, zipPath) {
  await mkdir(dirname(zipPath), { recursive: true })
  await new Promise((resolvePromise, reject) => {
    const child = spawn('zip', ['-qr', zipPath, '.'], { cwd: sourceDir, stdio: 'ignore' })
    child.on('error', reject)
    child.on('exit', (code) => {
      if (code === 0) resolvePromise()
      else reject(new Error(`zip failed with exit code ${code}`))
    })
  })
}

export async function buildArchive(options) {
  const inputPath = resolve(options.inputPath)
  const inputDir = resolve(options.inputBaseDir ?? dirname(inputPath))
  const rawInput = JSON.parse(await readFile(inputPath, 'utf-8'))
  const validation = validateArchiveInput(rawInput)
  if (!validation.ok) {
    throw new Error(`Invalid archive input:\n${validation.errors.map((error) => `- ${error}`).join('\n')}`)
  }

  const privacyProfile = options.privacyProfile ?? 'public-demo'
  const redacted = redactArchiveInput(rawInput, { privacyProfile, now: options.now })

  const outputPath = resolve(options.outputPath)
  const outputIsZip = outputPath.endsWith('.zip')
  const archiveDir = outputIsZip
    ? await mkdtemp(join(tmpdir(), 'open-memory-archive-'))
    : outputPath

  await rm(archiveDir, { recursive: true, force: true })
  await mkdir(join(archiveDir, 'data'), { recursive: true })

  redacted.media = await copyMediaFiles(redacted, inputDir, archiveDir)
  const manifest = buildManifest(redacted, { now: options.now })

  await writeFile(join(archiveDir, 'data/archive.json'), `${JSON.stringify(redacted, null, 2)}\n`, 'utf-8')
  await writeFile(join(archiveDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8')
  await writeFile(join(archiveDir, 'index.html'), renderViewerHtml(redacted, manifest), 'utf-8')
  await writeChecksumsFile(archiveDir)

  if (outputIsZip) {
    await rm(outputPath, { force: true })
    await zipDirectory(archiveDir, outputPath)
    return {
      archiveDir,
      archivePath: outputPath,
      sizeBytes: await fileSizeBytes(outputPath),
      checksumSha256: await sha256File(outputPath),
      manifest,
    }
  }

  return {
    archiveDir,
    archivePath: archiveDir,
    sizeBytes: null,
    checksumSha256: null,
    manifest,
  }
}
