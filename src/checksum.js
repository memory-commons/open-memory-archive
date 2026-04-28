import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'

export async function sha256File(filePath) {
  const hash = createHash('sha256')
  const stream = createReadStream(filePath)
  await new Promise((resolve, reject) => {
    stream.on('data', (chunk) => hash.update(chunk))
    stream.on('error', reject)
    stream.on('end', resolve)
  })
  return hash.digest('hex')
}

export async function listFilesRecursive(rootDir) {
  const files = []
  async function visit(dir) {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) await visit(fullPath)
      if (entry.isFile()) files.push(fullPath)
    }
  }
  await visit(rootDir)
  return files.sort((a, b) => toArchivePath(rootDir, a).localeCompare(toArchivePath(rootDir, b)))
}

export function toArchivePath(rootDir, filePath) {
  return relative(rootDir, filePath).split(sep).join('/')
}

export async function writeChecksumsFile(rootDir, outputPath = 'data/checksums.sha256') {
  await mkdir(dirname(join(rootDir, outputPath)), { recursive: true })
  const files = (await listFilesRecursive(rootDir)).filter(
    (filePath) => toArchivePath(rootDir, filePath) !== outputPath
  )
  const entries = []
  for (const filePath of files) {
    entries.push({ path: toArchivePath(rootDir, filePath), sha256: await sha256File(filePath) })
  }
  const body = entries.map((entry) => `${entry.sha256}  ${entry.path}`).join('\n')
  await writeFile(join(rootDir, outputPath), `${body}\n`, 'utf-8')
  return entries
}

export async function fileSizeBytes(filePath) {
  return (await stat(filePath)).size
}

