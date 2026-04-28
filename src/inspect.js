import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'

export async function inspectPrivacy(archiveDir) {
  const rootDir = resolve(archiveDir)
  const manifest = JSON.parse(await readFile(join(rootDir, 'manifest.json'), 'utf-8'))
  const archive = JSON.parse(await readFile(join(rootDir, 'data/archive.json'), 'utf-8'))
  const redactions = Array.isArray(archive.redactions) ? archive.redactions : []

  return {
    archiveDir: rootDir,
    publication: manifest.publication ?? {},
    privacy: manifest.privacy ?? {},
    redactions,
  }
}

export function formatPrivacyInspection(inspection) {
  const lines = [
    `Archive: ${inspection.archiveDir}`,
    `Publication: ${inspection.publication.title ?? 'Untitled'}`,
    `Privacy profile: ${inspection.privacy.profile ?? 'unknown'}`,
    `Contains personal data: ${Boolean(inspection.privacy.containsPersonalData)}`,
    `Contains living person data: ${Boolean(inspection.privacy.containsLivingPersonData)}`,
    `Contains special category data: ${Boolean(inspection.privacy.containsSpecialCategoryData)}`,
    `Redactions applied: ${Number(inspection.privacy.redactionCount ?? inspection.redactions.length)}`,
    `External network required: ${Boolean(inspection.privacy.externalNetworkRequired)}`,
    `Telemetry enabled: ${Boolean(inspection.privacy.telemetryEnabled)}`,
  ]

  if (inspection.redactions.length > 0) {
    lines.push('', 'Redactions:')
    for (const redaction of inspection.redactions) {
      lines.push(
        `- ${redaction.path}: ${redaction.reason} (${redaction.replacement ?? 'removed'})`
      )
    }
  }

  return `${lines.join('\n')}\n`
}
