# Module Build Context

Use this file to brief an agent that is building LMS module content from scratch.

The agent should create module package JSON files. It should not edit `prisma/seed.js` and should not write directly to Postgres.

## Output Location

Create one file per module under:

- `content/modules`

Recommended filename:

- `<module-key>.module.json`

Example:

- `content/modules/SUR-UW-SWP-GEN-1-1.module.json`

## Import Mechanism

Module packages are imported by the LMS Core API through the shared importer in `src/modulePackages.js`.

CLI import:

- Dry run: `npm run module:import -- content/modules/SUR-UW-SWP-GEN-1-1.module.json --dry-run`
- Apply: `npm run module:import -- content/modules/SUR-UW-SWP-GEN-1-1.module.json`
- Skip document existence checks: add `--skip-resource-check`

Admin API import:

- Dry run: `POST /admin/modules/import?dryRun=true`
- Apply: `POST /admin/modules/import`
- Skip document existence checks: `POST /admin/modules/import?checkResources=false`

The admin API requires an `ADMIN` JWT bearer token.

## Import Behavior

The importer:

- validates the package with Zod
- verifies required `/documents/<filename>` resources exist unless checks are disabled
- upserts competencies by `code`
- upserts the module by `module.key`, stored as `Module.moduleKey`
- replaces the module's competency mappings in one transaction
- stores `module.contentBody` as structured JSON

Imports are idempotent when `module.key` stays stable.

## Required Package Shape

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
      "Review the tools, equipment, people, PPE, and controls required by the source document.",
      "Confirm understanding through a short quiz before supervisor or trainer signoff."
    ],
    "estimatedMinutes": 15,
    "contentUrl": "/documents/sur-uw-swp.pdf",
    "contentBody": {
      "title": "GEN 1.1 - Refuelling Diesel Engines",
      "subtitle": "Self-directed document review module.",
      "slides": [],
      "quiz": []
    }
  },
  "competencies": [
    {
      "code": "SUR-UW-SWP-GEN-1-1",
      "title": "GEN 1.1 - Refuelling Diesel Engines",
      "category": "Surface Utility Worker",
      "description": "Self-directed competency for GEN 1.1 from SUR-UW-SWP.pdf."
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
    "builtBy": "module-agent"
  }
}
```

## Field Rules

`module.key`

- Required stable identifier.
- Must be unique across modules.
- Use uppercase domain-style keys where practical.
- Allowed characters: letters, numbers, dots, underscores, hyphens.
- Do not change it after a module is imported unless intentionally creating a new module.

`module.mode`

- Use `INDIVIDUAL` for self-directed modules.
- Use `FACILITATED` for trainer-led sessions.
- Use `HYBRID` when both self-directed content and facilitated delivery are expected.

`module.category`

- Current examples include `GEOTECH`, `HSE`, `PLANT`, and `SURFACE`.
- Prefer a concise operational category over a decorative label.

`module.learningObjectives`

- Prefer an array of short objective strings.
- The importer stores these as newline-separated text.

`module.contentUrl`

- Optional.
- Must be a `/documents/<filename>` URL.
- Use when there is a primary source document.

`module.contentBody`

- Required structured JSON object or array.
- Do not stringify it.
- This is the UI-facing learning content.

`competencies`

- Include every competency that the package maps to.
- `code` is the stable idempotency key for competencies.
- A module can map to a competency only once.

`mappings`

- Each mapping must reference a competency code defined in the package.
- `evidenceType` must be one of:
  - `COMPLETION`
  - `QUIZ`
  - `SESSION`
  - `SIGNOFF`

`resources`

- List required source resources that must already exist in `DOCUMENTS_ROOT`.
- URLs must use `/documents/<filename>`.
- Uploaded resources are managed separately through `POST /documents/upload`.

## Recommended `contentBody` Shape

The frontend currently expects module decks and quizzes to be easy to render from JSON.

Recommended top-level shape:

```json
{
  "title": "Module title",
  "subtitle": "Short context line",
  "slides": [
    {
      "id": "hero",
      "type": "hero",
      "eyebrow": "Role or category",
      "title": "Slide title",
      "body": "Short learner-facing explanation.",
      "meta": ["Source: SUR-UW-SWP.pdf"],
      "fact": "Optional short callout"
    },
    {
      "id": "review",
      "type": "checklist",
      "eyebrow": "Document review",
      "title": "Read the controlled document closely",
      "checklist": ["Point one", "Point two"]
    },
    {
      "id": "hazards",
      "type": "bullets",
      "eyebrow": "Hazards and controls",
      "title": "What can go wrong",
      "bullets": ["Hazard/control point one", "Hazard/control point two"]
    }
  ],
  "quiz": [
    {
      "id": "q1",
      "question": "Question text?",
      "options": ["Correct answer", "Distractor", "Distractor", "Distractor"],
      "correctIndex": 0,
      "explanation": "Explain why the answer is correct."
    }
  ]
}
```

Common slide types already used in seeded content:

- `hero`
- `bullets`
- `checklist`

Optional fields already used:

- `imageUrl`
- `imageCaption`
- `links`
- `fact`
- `meta`

## Content Standards

Build modules as operational training, not marketing copy.

Each module should:

- name the source document or training package
- explain what the learner must be able to do
- identify tools, equipment, people, PPE, hazards, controls, and stop/escalate conditions where relevant
- include practical readiness checks before signoff
- include a quiz when `evidenceType` is `QUIZ`
- keep quiz explanations specific to the source material
- preserve controlled-document language carefully where accuracy matters, while avoiding long verbatim copying

Avoid:

- invented controls not supported by the source
- vague safety language that cannot be assessed
- decorative slides that do not teach or check anything
- changing existing module keys or competency codes casually
- embedding local filesystem paths in learner-facing content

## Agent Workflow

1. Read the source material and identify the exact document title, number, role, and package.
2. Choose a stable `module.key` and matching competency `code`.
3. Build the JSON package under `content/modules`.
4. Run a dry-run import.
5. Fix any schema or missing-resource errors.
6. Ask for review before applying if the source content is safety-critical.
7. Apply the import only after the package is approved.

## Review Checklist

Before import, confirm:

- `module.key` is stable and unique.
- `competencies[].code` is stable and unique.
- every mapping references a package competency.
- every required resource exists under `DOCUMENTS_ROOT`.
- `contentBody` is native JSON, not a string.
- quiz `correctIndex` values point at the right option.
- learner-facing wording is clear, assessable, and specific.
- the module can stand alone without the agent's private notes.
