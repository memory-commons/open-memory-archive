#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { buildArchive } from './builder.js'
import { verifyChecksums } from './checksum.js'
import { formatPrivacyInspection, inspectPrivacy } from './inspect.js'
import { validateArchiveInput } from './schema.js'

function parseArgs(argv) {
  const [command, ...rest] = argv
  const args = { command, _: [] }
  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index]
    if (value.startsWith('--')) {
      const key = value.slice(2)
      const next = rest[index + 1]
      if (!next || next.startsWith('--')) {
        args[key] = true
      } else {
        args[key] = next
        index += 1
      }
    } else {
      args._.push(value)
    }
  }
  return args
}

function printHelp() {
  console.log(`open-memory-archive

Usage:
  open-memory-archive build <archive-input.json> --out <archive-dir-or-zip>
  open-memory-archive validate <archive-input.json>
  open-memory-archive verify-checksums <archive-dir>
  open-memory-archive inspect-privacy <archive-dir>

Options:
  --privacy-profile <name>   public-demo | family-export | research-export
  --out <path>               Output archive directory or .zip path
`)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.command || args.command === 'help' || args.command === '--help') {
    printHelp()
    return
  }

  if (args.command === 'validate') {
    const inputPath = args._[0]
    if (!inputPath) throw new Error('validate requires an input path')
    const input = JSON.parse(await readFile(resolve(inputPath), 'utf-8'))
    const result = validateArchiveInput(input)
    if (!result.ok) {
      console.error(result.errors.map((error) => `- ${error}`).join('\n'))
      process.exitCode = 1
      return
    }
    console.log('Archive input is valid.')
    return
  }

  if (args.command === 'build') {
    const inputPath = args._[0]
    if (!inputPath) throw new Error('build requires an input path')
    if (!args.out) throw new Error('build requires --out <path>')
    const result = await buildArchive({
      inputPath,
      outputPath: args.out,
      privacyProfile: args['privacy-profile'] ?? 'public-demo',
    })
    console.log(`Archive built: ${result.archivePath}`)
    console.log(`Privacy profile: ${result.manifest.privacy.profile}`)
    console.log(`Contains personal data: ${result.manifest.privacy.containsPersonalData}`)
    console.log(`Contains living person data: ${result.manifest.privacy.containsLivingPersonData}`)
    console.log(`Redactions applied: ${result.manifest.privacy.redactionCount}`)
    console.log(`External network required: ${result.manifest.privacy.externalNetworkRequired}`)
    console.log(`Telemetry enabled: ${result.manifest.privacy.telemetryEnabled}`)
    if (result.checksumSha256) console.log(`Archive sha256: ${result.checksumSha256}`)
    return
  }

  if (args.command === 'verify-checksums') {
    const archiveDir = args._[0]
    if (!archiveDir) throw new Error('verify-checksums requires an archive directory')
    const result = await verifyChecksums(resolve(archiveDir))
    console.log(`Checksums checked: ${result.checked}`)
    if (!result.ok) {
      for (const failure of result.failures) {
        console.error(`Mismatch: ${failure.path}`)
      }
      process.exitCode = 1
      return
    }
    console.log('All checksums match.')
    return
  }

  if (args.command === 'inspect-privacy') {
    const archiveDir = args._[0]
    if (!archiveDir) throw new Error('inspect-privacy requires an archive directory')
    console.log(formatPrivacyInspection(await inspectPrivacy(resolve(archiveDir))))
    return
  }

  throw new Error(`Unknown command: ${args.command}`)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
