# Schema Alignment

Open Memory Archive v1 uses custom field names to keep the format compact and forward-compatible. This document maps the core entities to established vocabularies so archives, libraries, and research institutions can evaluate interoperability.

## Entity Mapping

| Open Memory Archive | Schema.org | CIDOC-CRM | GEDCOM X |
| ------------------- | ---------- | --------- | -------- |
| `event` | [`schema:Event`](https://schema.org/Event) | [`E5 Event`](https://cidoc-crm.org/Entity/e5-event/version-7.1.1) | — |
| `person` | [`schema:Person`](https://schema.org/Person) | [`E21 Person`](https://cidoc-crm.org/Entity/e21-person/version-7.1.1) | [`Person`](https://gedcomx.org/v1/Person) |
| `location` | [`schema:Place`](https://schema.org/Place) | [`E53 Place`](https://cidoc-crm.org/Entity/e53-place/version-7.1.1) | — |
| `relationship` | `schema:knows` / properties | [`E13 Attribute Assignment`](https://cidoc-crm.org/Entity/e13-attribute-assignment/version-7.1.1) | [`Relationship`](https://gedcomx.org/v1/Relationship) |
| `chapter` / `section` | [`schema:Article`](https://schema.org/Article) | [`E33 Linguistic Object`](https://cidoc-crm.org/Entity/e33-linguistic-object/version-7.1.1) | — |
| `media` | [`schema:MediaObject`](https://schema.org/MediaObject) | [`E73 Information Object`](https://cidoc-crm.org/Entity/e73-information-object/version-7.1.1) | — |

## Privacy Fields

The `privacy` object does not have a direct equivalent in Schema.org or CIDOC-CRM. Its field names are aligned with GDPR terminology.

| Field | GDPR reference |
| ----- | -------------- |
| `consentStatus` | Article 7, conditions for consent |
| `livingPersonStatus` | Recital 27, data of deceased persons |
| `containsSpecialCategoryData` | Article 9, special categories of personal data |
| `legalBasisHint` | Article 6, lawfulness of processing |

## Compatibility Notes

This mapping is a reference document, not a formal ontology alignment. The v1 format uses `additionalProperties: true` on all core entities, so adopters can attach `@context`, `sameAs`, or institution-specific identifiers without breaking validation. A formal JSON-LD context is planned for v2.

Schema.org models relationships as properties rather than a standalone Relationship class. The mapping above uses `schema:knows` as a representative property; adopters should select the most appropriate Schema.org property for their specific relationship type.
