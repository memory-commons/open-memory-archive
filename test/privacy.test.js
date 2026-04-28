import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { redactArchiveInput } from '../src/privacy.js'

test('public-demo redacts family-scope living person', async () => {
  const input = JSON.parse(await readFile('examples/redacted-family/archive.json', 'utf-8'))
  const output = redactArchiveInput(input, {
    privacyProfile: 'public-demo',
    now: '2026-05-05T12:00:00Z',
  })

  const person = output.people.find((item) => item.id === 'person-living')
  assert.equal(person.displayName, 'Redacted person')
  assert.equal(person.redacted, true)
  assert.equal(person.email, undefined)
  assert.ok(output.redactions.some((entry) => entry.path === '$.people[0]'))
})

test('withdrawn consent is recorded as a redaction reason', async () => {
  const input = JSON.parse(await readFile('examples/redacted-family/archive.json', 'utf-8'))
  const output = redactArchiveInput(input, {
    privacyProfile: 'public-demo',
    now: '2026-05-05T12:00:00Z',
  })

  assert.ok(output.redactions.some((entry) => entry.reason === 'withdrawn_consent'))
})

