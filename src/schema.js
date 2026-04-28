export const ARCHIVE_INPUT_FORMAT = 'open-memory-archive-input-v1'
export const ARCHIVE_FORMAT = 'open-memory-archive-v1'
export const ARCHIVE_FORMAT_VERSION = 1
export const BUILDER_VERSION = '0.1.0'

export const PRIVACY_SCOPES = new Set(['public', 'family', 'private', 'research', 'redacted'])
export const CONSENT_STATUSES = new Set([
  'granted',
  'withdrawn',
  'unknown',
  'not_applicable',
  'not_required',
])
export const LIVING_PERSON_STATUSES = new Set([
  'living',
  'deceased',
  'unknown',
  'organization',
  'fictional',
  'not_applicable',
])

export const DEFAULT_PRIVACY = Object.freeze({
  privacyScope: 'public',
  consentStatus: 'unknown',
  livingPersonStatus: 'unknown',
  containsPersonalData: false,
  containsSpecialCategoryData: false,
  legalBasisHint: 'unknown',
})

function isRecord(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function validatePrivacy(value, path, errors) {
  if (value === undefined || value === null) return
  if (!isRecord(value)) {
    errors.push(`${path} must be an object`)
    return
  }
  if (value.privacyScope !== undefined && !PRIVACY_SCOPES.has(value.privacyScope)) {
    errors.push(`${path}.privacyScope must be one of ${[...PRIVACY_SCOPES].join(', ')}`)
  }
  if (value.consentStatus !== undefined && !CONSENT_STATUSES.has(value.consentStatus)) {
    errors.push(`${path}.consentStatus must be one of ${[...CONSENT_STATUSES].join(', ')}`)
  }
  if (
    value.livingPersonStatus !== undefined &&
    !LIVING_PERSON_STATUSES.has(value.livingPersonStatus)
  ) {
    errors.push(
      `${path}.livingPersonStatus must be one of ${[...LIVING_PERSON_STATUSES].join(', ')}`
    )
  }
}

function requireString(record, key, path, errors) {
  if (typeof record[key] !== 'string' || record[key].trim() === '') {
    errors.push(`${path}.${key} must be a non-empty string`)
  }
}

function validateCollection(value, path, errors, validateItem) {
  if (value === undefined) return
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`)
    return
  }
  value.forEach((item, index) => validateItem(item, `${path}[${index}]`, errors))
}

export function validateArchiveInput(input) {
  const errors = []
  if (!isRecord(input)) {
    return { ok: false, errors: ['archive input must be an object'] }
  }

  if (input.format !== ARCHIVE_INPUT_FORMAT) {
    errors.push(`format must be ${ARCHIVE_INPUT_FORMAT}`)
  }

  if (!isRecord(input.publication)) {
    errors.push('publication must be an object')
  } else {
    requireString(input.publication, 'id', 'publication', errors)
    requireString(input.publication, 'title', 'publication', errors)
    validatePrivacy(input.publication.privacy, 'publication.privacy', errors)
  }

  validateCollection(input.chapters, 'chapters', errors, (chapter, path, collectionErrors) => {
    if (!isRecord(chapter)) {
      collectionErrors.push(`${path} must be an object`)
      return
    }
    requireString(chapter, 'id', path, collectionErrors)
    requireString(chapter, 'title', path, collectionErrors)
    validatePrivacy(chapter.privacy, `${path}.privacy`, collectionErrors)
    validateCollection(chapter.sections, `${path}.sections`, collectionErrors, (section, sectionPath) => {
      if (!isRecord(section)) {
        collectionErrors.push(`${sectionPath} must be an object`)
        return
      }
      requireString(section, 'id', sectionPath, collectionErrors)
      validatePrivacy(section.privacy, `${sectionPath}.privacy`, collectionErrors)
    })
  })

  validateCollection(input.people, 'people', errors, (person, path, collectionErrors) => {
    if (!isRecord(person)) {
      collectionErrors.push(`${path} must be an object`)
      return
    }
    requireString(person, 'id', path, collectionErrors)
    requireString(person, 'displayName', path, collectionErrors)
    validatePrivacy(person.privacy, `${path}.privacy`, collectionErrors)
  })

  validateCollection(input.events, 'events', errors, (event, path, collectionErrors) => {
    if (!isRecord(event)) {
      collectionErrors.push(`${path} must be an object`)
      return
    }
    requireString(event, 'id', path, collectionErrors)
    requireString(event, 'title', path, collectionErrors)
    validatePrivacy(event.privacy, `${path}.privacy`, collectionErrors)
  })

  validateCollection(input.locations, 'locations', errors, (location, path, collectionErrors) => {
    if (!isRecord(location)) {
      collectionErrors.push(`${path} must be an object`)
      return
    }
    requireString(location, 'id', path, collectionErrors)
    requireString(location, 'name', path, collectionErrors)
    validatePrivacy(location.privacy, `${path}.privacy`, collectionErrors)
  })

  validateCollection(input.media, 'media', errors, (media, path, collectionErrors) => {
    if (!isRecord(media)) {
      collectionErrors.push(`${path} must be an object`)
      return
    }
    requireString(media, 'id', path, collectionErrors)
    if (typeof media.localPath !== 'string' && typeof media.sourcePath !== 'string') {
      collectionErrors.push(`${path}.localPath or ${path}.sourcePath must be provided`)
    }
    validatePrivacy(media.privacy, `${path}.privacy`, collectionErrors)
  })

  return { ok: errors.length === 0, errors }
}

export function validateArchiveManifest(manifest) {
  const errors = []
  if (!isRecord(manifest)) return { ok: false, errors: ['manifest must be an object'] }
  if (manifest.format !== ARCHIVE_FORMAT) errors.push(`format must be ${ARCHIVE_FORMAT}`)
  if (manifest.formatVersion !== ARCHIVE_FORMAT_VERSION) {
    errors.push(`formatVersion must be ${ARCHIVE_FORMAT_VERSION}`)
  }
  if (!isRecord(manifest.privacy)) errors.push('privacy summary must be an object')
  return { ok: errors.length === 0, errors }
}

export function normalizePrivacy(value = {}) {
  return {
    ...DEFAULT_PRIVACY,
    ...(isRecord(value) ? value : {}),
  }
}

export function isRecordValue(value) {
  return isRecord(value)
}
