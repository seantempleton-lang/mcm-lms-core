# LMS Module Creation Guide

This guide describes how to build self-directed LMS modules for `mcm-lms-core`.

Use this when turning SWPs, JSAs, risk assessments, PowerPoints, or training packages into importable LMS modules.

## Where Modules Live

Create one JSON package per module in:

```text
content/modules
```

Recommended filename:

```text
<MODULE-KEY>.module.json
```

Example:

```text
content/modules/SUR-UW-SWP-GEN-1-1.module.json
```

Source PDFs, page images, diagrams, and other learner resources should live in:

```text
content/documents
```

At runtime these are served as:

```text
/documents/<filename>
```

Do not use local filesystem paths inside module content.

## Module Package Structure

Each module package has five top-level parts:

```json
{
  "module": {},
  "competencies": [],
  "mappings": [],
  "resources": [],
  "metadata": {}
}
```

`module` is the learner-facing module.

`competencies` defines the competency records that can be awarded.

`mappings` connects this module to one or more competencies.

`resources` lists required files such as PDFs or images.

`metadata` records source and build context.

## Minimal Example

```json
{
  "module": {
    "key": "SUR-UW-SWP-GEN-1-1",
    "title": "GEN 1.1 - Refuelling Diesel Engines",
    "mode": "INDIVIDUAL",
    "category": "SURFACE",
    "description": "Self-directed review for GEN 1.1 from SUR-UW-SWP.pdf.",
    "learningObjectives": [
      "Identify when GEN 1.1 applies and what safe completion looks like.",
      "Review the tools, equipment, people, PPE, hazards, and controls required by the source document.",
      "Confirm understanding through a short quiz before supervisor or trainer signoff."
    ],
    "estimatedMinutes": 15,
    "contentUrl": "/documents/sur-uw-swp.pdf",
    "contentBody": {
      "title": "GEN 1.1 - Refuelling Diesel Engines",
      "subtitle": "Self-directed SWP review module.",
      "slides": [],
      "quiz": []
    }
  },
  "competencies": [
    {
      "code": "SUR-UW-SWP-GEN-1-1",
      "title": "GEN 1.1 - Refuelling Diesel Engines",
      "category": "Surface Utility Worker",
      "description": "Understands the controls and sequence for refuelling diesel engines."
    }
  ],
  "mappings": [
    {
      "competencyCode": "SUR-UW-SWP-GEN-1-1",
      "evidenceType": "QUIZ"
    }
  ],
  "resources": [
    {
      "url": "/documents/sur-uw-swp.pdf",
      "required": true
    }
  ],
  "metadata": {
    "sourceDocument": "SUR-UW-SWP.pdf",
    "sourceDocumentNumber": "GEN 1.1",
    "builtBy": "module-author"
  }
}
```

## Content Body Format

The LMS uses `module.contentBody` as structured JSON. Do not stringify it.

Recommended shape:

```json
{
  "title": "Module title",
  "subtitle": "Short context line",
  "slides": [
    {
      "id": "hero",
      "type": "hero",
      "eyebrow": "Role or category",
      "title": "Main learner message",
      "body": "Short explanation of what this module covers.",
      "meta": ["Source: SUR-UW-SWP.pdf"],
      "fact": "Short callout"
    },
    {
      "id": "review",
      "type": "checklist",
      "eyebrow": "Document review",
      "title": "Read the controlled document closely",
      "checklist": ["Review item one", "Review item two"]
    },
    {
      "id": "hazards",
      "type": "bullets",
      "eyebrow": "Hazards and controls",
      "title": "What can go wrong",
      "bullets": ["Hazard and control point one", "Hazard and control point two"]
    }
  ],
  "quiz": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": ["Correct answer", "Distractor", "Distractor", "Distractor"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct."
    }
  ]
}
```

Supported slide types already used by the LMS content:

- `hero`
- `bullets`
- `checklist`

Useful optional slide fields:

- `fact`
- `meta`
- `links`
- `imageUrl`
- `imageCaption`
- `videoUrl`

## Building From A PDF

For source PDFs, build the module from the controlled document rather than only the table of contents.

Recommended workflow:

1. Identify the exact document title, document number, equipment, role, revision date, and source package.
2. Extract the relevant pages for the module.
3. Pull out the learner-critical text:
   - tools and equipment
   - personnel required
   - PPE
   - safety procedures
   - application
   - job steps
   - hazards
   - controls
   - stop-work or escalation conditions
4. Render diagrams or source pages to images when layout matters.
5. Save required resources under `content/documents`.
6. Reference them with `/documents/<filename>` URLs.
7. Build slides that teach the extracted content.
8. Build quiz questions directly from the source document.
9. Validate with a dry run import.

For procedure tables, avoid relying on raw PDF extraction alone. Check the rendered page image against the extracted text.

## Quiz Rules

Use a quiz when the mapping evidence type is `QUIZ`.

Good quiz questions:

- check source-document familiarity
- use clear workplace language
- have one defensibly correct answer
- include plausible but safe distractors
- include a specific explanation

Avoid:

- trick questions
- made-up controls
- questions based only on the slide wording when the source document says more
- answers that depend on private notes outside the module

Recommended quiz length:

- 3 to 5 questions for short SWPs
- 6 to 10 questions for longer JSAs, PRAs, or training packages

## Naming Standards

`module.key` and `competencies[].code` are stable identifiers.

Use uppercase keys with operational prefixes:

```text
SUR-UW-SWP-GEN-1-1
SUR-DA-TP-TP-01-05
HSE-MAR-JSA-BARGE
PLANT-P399-PRA
```

Do not change a key after import unless you intentionally want a new module.

## Importing And Validating

Dry run a module package:

```powershell
npm.cmd run module:import -- content/modules/SUR-UW-SWP-GEN-1-1.module.json --dry-run
```

Apply the import:

```powershell
npm.cmd run module:import -- content/modules/SUR-UW-SWP-GEN-1-1.module.json
```

If resources are not available yet and you only want schema validation:

```powershell
npm.cmd run module:import -- content/modules/SUR-UW-SWP-GEN-1-1.module.json --dry-run --skip-resource-check
```

The importer will:

- validate the JSON package
- check required `/documents/<filename>` resources exist
- upsert competencies by `code`
- upsert the module by `module.key`
- replace module competency mappings
- store `contentBody` as structured JSON

## Quality Checklist

Before importing, confirm:

- the module key is stable and unique
- the competency code is stable and unique
- every mapped competency exists in the package
- every required resource exists under `content/documents` or the configured documents root
- `contentBody` is JSON, not a JSON string
- all image and PDF links use `/documents/<filename>`
- quiz `correctIndex` values point to the correct answer
- source document text has been checked against the rendered PDF where layout matters
- learner-facing content is specific, assessable, and operational
- the module does not invent controls that are absent from the source
- the module can stand alone without private notes from the author

## When To Use Seed Data Instead

Prefer module packages under `content/modules`.

Only edit `prisma/seed.js` for baseline demo data, test accounts, or legacy seed content. New training modules should be authored as module package JSON and imported through the module importer.
