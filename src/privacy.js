import { normalizePrivacy } from './schema.js'

const SENSITIVE_KEYS = new Set([
  'email',
  'phone',
  'address',
  'exactAddress',
  'streetAddress',
  'postalCode',
  'nationalId',
  'accountId',
  'userId',
  'storagePath',
  'signedUrl',
  'remoteUrl',
  'sourceUrl',
  'privateNote',
])

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function nowIso(options) {
  return options.now ?? new Date().toISOString()
}

function isPublicDemo(options) {
  return (options.privacyProfile ?? 'public-demo') === 'public-demo'
}

function privacyRequiresRemoval(privacy, options) {
  if (privacy.consentStatus === 'withdrawn') return 'withdrawn_consent'
  if (privacy.privacyScope === 'private') return 'private_scope'
  if (isPublicDemo(options) && privacy.privacyScope === 'family') return 'private_scope'
  if (isPublicDemo(options) && privacy.privacyScope === 'research') return 'operator_policy'
  if (privacy.containsSpecialCategoryData) return 'special_category'
  return null
}

function livingPersonRequiresRedaction(privacy, options) {
  if (!isPublicDemo(options)) return false
  if (privacy.livingPersonStatus === 'living') {
    return privacy.privacyScope !== 'public' || privacy.consentStatus !== 'granted'
  }
  return privacy.livingPersonStatus === 'unknown' && privacy.containsPersonalData
}

function redactPath(redactions, path, reason, options, replacement = 'removed') {
  redactions.push({
    path,
    reason,
    ruleId: options.ruleId ?? 'default-public-demo-v1',
    appliedAt: nowIso(options),
    replacement,
  })
}

function stripSensitiveFields(record, basePath, redactions, options) {
  for (const key of Object.keys(record)) {
    const value = record[key]
    const lowerKey = key.toLowerCase()
    const isSensitive = SENSITIVE_KEYS.has(key) || [...SENSITIVE_KEYS].some((item) => lowerKey === item.toLowerCase())
    const looksLikeSignedUrl =
      typeof value === 'string' &&
      (/X-Amz-Signature=/i.test(value) || /token=/i.test(value) || /signature=/i.test(value))

    if (isSensitive || looksLikeSignedUrl) {
      delete record[key]
      redactPath(redactions, `${basePath}.${key}`, 'operator_policy', options)
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      stripSensitiveFields(value, `${basePath}.${key}`, redactions, options)
    }
  }
}

function redactPerson(person, index, redactions, options) {
  const next = clone(person)
  const privacy = normalizePrivacy(next.privacy)
  const removalReason = privacyRequiresRemoval(privacy, options)
  const basePath = `$.people[${index}]`

  if (removalReason) {
    redactPath(redactions, basePath, removalReason, options, 'placeholder')
    return {
      id: next.id,
      displayName: 'Redacted person',
      privacy: { ...privacy, privacyScope: 'redacted' },
      redacted: true,
    }
  }

  if (livingPersonRequiresRedaction(privacy, options)) {
    if (next.displayName) {
      next.displayName = initials(next.displayName)
      redactPath(redactions, `${basePath}.displayName`, 'living_person', options, 'initials')
    }
    for (const key of ['birthDate', 'birthPlace', 'currentLocation', 'biography', 'notes']) {
      if (next[key] !== undefined) {
        delete next[key]
        redactPath(redactions, `${basePath}.${key}`, 'living_person', options)
      }
    }
    next.redacted = true
    next.privacy = { ...privacy, privacyScope: 'redacted' }
  }

  stripSensitiveFields(next, basePath, redactions, options)
  return next
}

function redactGenericEntity(entity, collectionName, index, redactions, options) {
  const next = clone(entity)
  const privacy = normalizePrivacy(next.privacy)
  const removalReason = privacyRequiresRemoval(privacy, options)
  const basePath = `$.${collectionName}[${index}]`

  if (removalReason) {
    redactPath(redactions, basePath, removalReason, options, 'placeholder')
    return {
      id: next.id,
      title: next.title ? 'Redacted item' : undefined,
      name: next.name ? 'Redacted location' : undefined,
      privacy: { ...privacy, privacyScope: 'redacted' },
      redacted: true,
    }
  }

  stripSensitiveFields(next, basePath, redactions, options)
  return next
}

function redactSection(section, chapterIndex, sectionIndex, redactions, options) {
  const next = clone(section)
  const privacy = normalizePrivacy(next.privacy)
  const removalReason = privacyRequiresRemoval(privacy, options)
  const basePath = `$.chapters[${chapterIndex}].sections[${sectionIndex}]`

  if (removalReason) {
    redactPath(redactions, basePath, removalReason, options, 'placeholder')
    return {
      id: next.id,
      title: 'Redacted section',
      text: '[Redacted]',
      privacy: { ...privacy, privacyScope: 'redacted' },
      redacted: true,
    }
  }

  stripSensitiveFields(next, basePath, redactions, options)
  return next
}

function redactMedia(media, index, redactions, options) {
  const next = clone(media)
  const privacy = normalizePrivacy(next.privacy)
  const removalReason = privacyRequiresRemoval(privacy, options)
  const basePath = `$.media[${index}]`

  if (removalReason) {
    redactPath(redactions, basePath, removalReason, options, 'placeholder')
    return {
      id: next.id,
      title: 'Redacted media',
      mediaType: next.mediaType ?? null,
      privacy: { ...privacy, privacyScope: 'redacted' },
      redacted: true,
    }
  }

  stripSensitiveFields(next, basePath, redactions, options)
  return next
}

function initials(name) {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .join('.')
}

function containsFlag(items, predicate) {
  return items.some((item) => predicate(normalizePrivacy(item?.privacy)))
}

export function redactArchiveInput(input, options = {}) {
  const redactions = []
  const output = clone(input)

  output.publication = redactGenericEntity(output.publication ?? {}, 'publication', 0, redactions, options)
  output.chapters = (output.chapters ?? []).map((chapter, chapterIndex) => {
    const next = redactGenericEntity(chapter, 'chapters', chapterIndex, redactions, options)
    next.sections = (chapter.sections ?? []).map((section, sectionIndex) =>
      redactSection(section, chapterIndex, sectionIndex, redactions, options)
    )
    return next
  })
  output.people = (output.people ?? []).map((person, index) => redactPerson(person, index, redactions, options))
  output.events = (output.events ?? []).map((event, index) =>
    redactGenericEntity(event, 'events', index, redactions, options)
  )
  output.locations = (output.locations ?? []).map((location, index) =>
    redactGenericEntity(location, 'locations', index, redactions, options)
  )
  output.media = (output.media ?? []).map((media, index) => redactMedia(media, index, redactions, options))

  const allPrivacyItems = [
    output.publication,
    ...(output.chapters ?? []),
    ...(output.people ?? []),
    ...(output.events ?? []),
    ...(output.locations ?? []),
    ...(output.media ?? []),
  ]

  output.redactions = redactions
  output.privacySummary = {
    profile: options.privacyProfile ?? 'public-demo',
    generatedAt: nowIso(options),
    generatedByTool: 'open-memory-archive',
    redactionPolicy: options.ruleId ?? 'default-public-demo-v1',
    containsPersonalData: containsFlag(allPrivacyItems, (privacy) => privacy.containsPersonalData),
    containsLivingPersonData: containsFlag(
      allPrivacyItems,
      (privacy) => privacy.livingPersonStatus === 'living' && privacy.privacyScope !== 'redacted'
    ),
    containsSpecialCategoryData: containsFlag(
      allPrivacyItems,
      (privacy) => privacy.containsSpecialCategoryData && privacy.privacyScope !== 'redacted'
    ),
    redactionCount: redactions.length,
    externalNetworkRequired: false,
    telemetryEnabled: false,
  }

  return output
}
