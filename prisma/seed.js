import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password.js';

const prisma = new PrismaClient();

async function upsertUser(email, name, role, password) {
  const passwordHash = await hashPassword(password);
  return prisma.user.upsert({
    where:  { email },
    update: { name, role, passwordHash },
    create: { email, name, role, passwordHash }
  });
}

async function main() {

  // ── Real users ──────────────────────────────────────────────
  await upsertUser('stempleton@drilling.co.nz', 'Sean Templeton', 'ADMIN',      'password123!');
  await upsertUser('tlubbe@drilling.co.nz',     'Tom Lubbe',      'SUPERVISOR', 'password123!');
  await upsertUser('gcossar@drilling.co.nz',    'Greg Cossar',    'LEARNER',    'password123!');

  // ── Default test accounts (remove when no longer needed) ────

  // ── Competencies ─────────────────────────────────────────────
  const dtFund = await prisma.competency.upsert({
    where:  { code: 'DT-FUND-01' },
    update: {},
    create: {
      code:        'DT-FUND-01',
      title:       'Dual Tube (DT) Drilling - Fundamentals',
      category:    'Geotech / DT',
      description: 'Understands the purpose of geotechnical drilling and how client objectives drive method selection and trade-offs. Can identify common failure modes and appropriate controls.'
    }
  });

  const dtFluids = await prisma.competency.upsert({
    where:  { code: 'DT-FLUID-01' },
    update: {},
    create: {
      code:        'DT-FLUID-01',
      title:       'Drilling Fluids and Mud Management',
      category:    'Geotech / DT',
      description: 'Can identify correct fluid types (water, air, polymer, bentonite, barite), explain their functions, mix to correct viscosity for ground conditions, and perform Marsh funnel and mud balance tests correctly.'
    }
  });

  const dtHeave = await prisma.competency.upsert({
    where:  { code: 'DT-HEAVE-01' },
    update: {},
    create: {
      code:        'DT-HEAVE-01',
      title:       'Fluid Equilibrium and Heave Control (DT)',
      category:    'Geotech / DT',
      description: 'Understands fluid equilibrium principles for DT drilling (small annulus sensitivity), recognises early signs of heave, and applies correct controls including slow withdrawal and continuous fluid top-up.'
    }
  });

  const dtArtesian = await prisma.competency.upsert({
    where:  { code: 'DT-ART-01' },
    update: {},
    create: {
      code:        'DT-ART-01',
      title:       'Artesian Pressure Awareness',
      category:    'Geotech / DT',
      description: 'Can define artesian pressure, identify confined aquifer conditions, apply the SG balance formula to calculate required mud weight, and knows when to escalate rather than self-manage.'
    }
  });

  // ── Module content ────────────────────────────────────────────
  // Source: Drilling Fundamentals.pptx (11 Jan 2023, 36 Hickory Place, Christchurch)
  const moduleContent = {
    overview: 'Fundamentals of Geotechnical Drilling. McMillan Drilling internal training, 11 January 2023, Christchurch. Covers why we drill, what can go wrong, controls and levers, drilling fluids, fluid equilibrium and heave control (DT focus), artesian pressure, and field tests (mud balance, Marsh funnel, pH). Delivered as a facilitated group session with individual quiz components.',
    sections: [
      {
        id: 'goals', title: 'Goals for the session', type: 'FACILITATED',
        content: [
          'Share some knowledge / theory for drilling.',
          'Provide some tools and tricks to use in the field.',
          'Answer any questions that you might have.'
        ],
        stopAndCheck: []
      },
      {
        id: 'why-we-drill', title: 'Why do we drill?', type: 'FACILITATED',
        content: [
          'For core recovery -- also includes special techniques like gel-push, Dames & Moore.',
          'For in-situ testing (usually SPT).',
          'For water -- piezos, wells, infiltration tests.',
          'To install instrumentation -- inclo, vwp, exto, etc.',
          'To allow another technique -- e.g. pre-drill for CPT.',
          'Important to understand the WHY from our client, because there is always a balance/compromise of one thing for another.'
        ],
        stopAndCheck: [
          'List three reasons geotechnical drilling is performed.',
          'Why does the client purpose change your drilling approach and trade-offs?',
          'What questions should you clarify before starting a run?'
        ]
      },
      {
        id: 'what-can-go-wrong', title: 'What can go wrong?', type: 'FACILITATED',
        content: [
          'Loss of core.', 'Heave.', 'Artesian flow.', 'Stuck install.',
          'Damaged instrumentation.', 'Stuck casing.', 'Not to mention rig problems!'
        ],
        stopAndCheck: [
          'Name four things that can go wrong during drilling.',
          'What early warning signs might indicate heave is developing?',
          'When should you stop and escalate rather than push on? Give two examples.'
        ]
      },
      {
        id: 'combat-issues', title: 'Ways to combat issues', type: 'FACILITATED',
        content: [
          'Drilling fluid preparation and circulation.',
          'Mud viscosity and weight.',
          'Bit/shoe type, size, wear condition.',
          'Speed -- rotation, feed, hammer, sonic frequency.',
          'Overcasing or pre-drilling.',
          'Right equipment for the task -- pumps, tanks, etc.',
          'Know the ground conditions.'
        ],
        stopAndCheck: [
          'Match each problem to the most likely first control: fluids / bit / speed / casing strategy / equipment.',
          'Why is it important to change one variable at a time when troubleshooting?'
        ]
      },
      {
        id: 'drilling-fluids', title: 'Drilling fluids', type: 'HYBRID',
        content: [
          'Fluid types: water, air, polymer, bentonite, barite.',
          'Lubricate and cool the bit/shoe -- water.',
          'Lubricate the drill string -- water, bentonite, polymer.',
          'Maintain fluid circulation / line the hole -- polymer.',
          'Balance heave or artesian pressure -- bentonite/barite.',
          'Lift cuttings to surface -- polymer, bentonite.',
          'Note: viscosity AND annular velocity both matter for effective cuttings transport.'
        ],
        stopAndCheck: [
          'Name the five fluid types used in geotechnical drilling.',
          'What are two functions of bentonite as a drilling fluid?',
          'Why do both viscosity and annular velocity matter when transporting cuttings?'
        ]
      },
      {
        id: 'fluid-equilibrium', title: 'Fluid equilibrium and heave control (DT)', type: 'HYBRID',
        content: [
          'Balance of fluid equilibrium applies to all types of drilling and is critical to managing heave.',
          'Particularly important for DT with very small annulus -- the space between casing and sample barrel or blind tip.',
          'Remove spike/sample barrel very slowly and continually top up water/mud in casing.',
          'If fluid level drops, ground pressure exceeds hydrostatic head and heave occurs.',
          'Key rule: slow withdrawal + continuous top-up = equilibrium maintained.'
        ],
        stopAndCheck: [
          'Why is fluid equilibrium especially critical in DT drilling?',
          'In a DT system, what is the annulus and why does its small size matter?',
          'Describe the correct procedure when pulling the sample barrel to avoid heave.'
        ]
      },
      {
        id: 'artesian-pressure', title: 'Artesian pressure', type: 'QUIZ',
        content: [
          'Artesian pressure: the piezometric equilibrium of a confined aquifer is above ground surface.',
          'Only occurs in confined aquifers -- must have an aquitard layer above (e.g. silt/clay).',
          'Temporary control: balance with weighted mud if we have a stable mud column or secondary casing.',
          'Formula: (metres above ground of artesian head + depth of casing) / depth of casing = SG of mud required.',
          'Worked example: 20 mbgl casing + 2m head: SG = (20+2)/20 = 1.1 g/cm3 = 1100 kg/m3.',
          'Water = 1000 kg/m3 already -- so add approx 100 kg of barite to a 1000 L tank.',
          'Always treat as temporary control only. Escalate to supervisor/engineer per site SOP.'
        ],
        stopAndCheck: [
          'Define artesian pressure in one sentence.',
          'What geological layer must exist above the aquifer for artesian pressure to occur?',
          'Calculate: casing depth 15 m, artesian head 3 m above ground. What SG mud is required?',
          'Name two situations where weighted mud alone is NOT sufficient to control artesian flow.'
        ]
      },
      {
        id: 'field-tests', title: 'Field tests -- mud balance, Marsh funnel, pH', type: 'QUIZ',
        content: [
          'Mud scales (mud balance): measures drilling fluid density in g/cm3 or kg/m3.',
          'Marsh funnel: time-based viscosity indicator. Fresh water = 26 s (quart standard). Typical mud = 30-90 s.',
          'Mud thickness guidelines (seconds/quart):',
          '  Natural swelling clays (<0.08mm): 32-37s',
          '  Non-swelling clays / fine sand (0.08-0.43mm): 40-45s',
          '  Medium sand (0.43-2.0mm): 45-55s',
          '  Coarse sand (2.0-4.8mm): 55-65s',
          '  Gravel (4.8-19.0mm): 65-75s',
          '  Coarse gravel (>19.0mm): 75-85s',
          'pH and soda ash: conditions water chemistry. Follow SDS and company SOP. Wear appropriate PPE.'
        ],
        stopAndCheck: [
          'What does the Marsh funnel measure and what is the fresh water baseline?',
          'What viscosity range would you target when drilling medium sand (0.43-2.0mm)?',
          'Why is trending Marsh funnel readings more useful than a single reading?',
          'What is soda ash used for and what PPE is required?'
        ]
      }
    ]
  };

  // ── Module upsert ─────────────────────────────────────────────
  const mod = await prisma.module.upsert({
    where:  { id: '00000000-0000-0000-0000-000000000001' },
    update: { title: 'Drilling Fundamentals', mode: 'HYBRID', category: 'GEOTECH', description: JSON.stringify(moduleContent) },
    create: { id: '00000000-0000-0000-0000-000000000001', title: 'Drilling Fundamentals', mode: 'HYBRID', category: 'GEOTECH', description: JSON.stringify(moduleContent) }
  });

  await prisma.module.upsert({
    where: { id: '00000000-0000-0000-0000-000000000002' },
    update: {
      title: 'P399 Plant Risk Assessment Review',
      mode: 'INDIVIDUAL',
      category: 'PLANT',
      description: 'Review the P399 Sonic Drilling Rig plant risk assessment, key hazards, current controls, and operator responsibilities before work starts.',
      learningObjectives: [
        'Identify the purpose of the P399 plant risk assessment and the signoff expectations before use.',
        'Recognise the main hazards and controls for the Geoprobe 8150LS Sonic Drilling Rig.',
        'Explain operator, supervisor, and visitor responsibilities identified in the assessment.',
        'Review understanding with an end-of-module quiz based on the real risk assessment.'
      ].join('\n'),
      estimatedMinutes: 25,
      contentBody: JSON.stringify({
        title: 'P399 Plant Risk Assessment Review',
        subtitle: 'Review the live plant risk assessment for the P399 Geoprobe 8150LS Sonic Drilling Rig before starting work.',
        slides: [
          {
            id: 'hero',
            type: 'hero',
            eyebrow: 'Plant category',
            title: 'Know the risk before you operate P399',
            body: 'This module walks the learner through the real plant risk assessment for the Sonic Drilling Rig so they can recognise hazards, confirm controls, and sign off with confidence.',
            meta: [
              'PRA Number 005',
              'Plant type: Sonic Drilling Rig',
              'Make / model: Geoprobe 8150LS',
              'Asset number: P399'
            ],
            fact: 'Risk = likelihood x consequence'
          },
          {
            id: 'signoff',
            type: 'checklist',
            eyebrow: 'Pre-start review',
            title: 'The assessment must be reviewed before use',
            checklist: [
              'Confirm the plant is designed to perform the task.',
              'Check whether the plant has been modified from OEM condition.',
              'Confirm the plant is in good working condition.',
              'Make sure action items from plant checks are closed out.',
              'Sign off only when the plant is safe to operate.'
            ]
          },
          {
            id: 'hazards',
            type: 'bullets',
            eyebrow: 'Key hazards',
            title: 'What can seriously hurt people around this rig?',
            bullets: [
              'Unexpected movement and people in the line of fire.',
              'Entanglement, crushing, trapping, cutting, and puncture hazards.',
              'Exposure to high-pressure hydraulic systems.',
              'Slips, trips, and falls around ancillary equipment or from climbing on the rig.',
              'Fire from hydraulic or diesel leaks contacting hot components.',
              'Weather, noise, and hazardous substances affecting safe operation.'
            ]
          },
          {
            id: 'controls',
            type: 'bullets',
            eyebrow: 'Controls in place',
            title: 'Current controls already required by the PRA',
            bullets: [
              'Operators must know the PRA, machine manual, signage, and rotary sonic rig JSA.',
              'Crew need clear line of sight, clear communication, and a pre-shift toolbox meeting.',
              'Visitors must be inducted and kept clear of the exclusion zone unless briefed.',
              'Routine maintenance, inspections, and annual component checks are required.',
              'Hearing protection is mandatory during machine operation.',
              'In bad weather, fold down the mast and isolate the machine.'
            ]
          },
          {
            id: 'follow-up',
            type: 'bullets',
            eyebrow: 'Ongoing requirements',
            title: 'What still has to happen after the PRA is issued?',
            bullets: [
              'Annual JSA review and refresher training.',
              'Annual VOC for operators.',
              'Daily pre-shift inspection using QuipCheck.',
              'Visitor briefing linked to the daily toolbox meeting.',
              'Fire extinguisher checks included in pre-start inspections.',
              'Hazardous substances register and MSDS sheets reviewed regularly.'
            ]
          },
          {
            id: 'ready-check',
            type: 'checklist',
            eyebrow: 'Before operating',
            title: 'Final readiness check for the learner',
            checklist: [
              'I know the task, plant, and main hazards.',
              'I have reviewed the PRA and JSA.',
              'Communication method and exclusion zones are clear.',
              'Pre-start checks, including QuipCheck, are complete.',
              'Required PPE is on and site/weather conditions are suitable.',
              'I know when to stop and escalate concerns.'
            ]
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'Why must personnel review and sign off the P399 plant risk assessment before work starts?',
            options: [
              'To confirm they understand the hazards and controls for the task and plant.',
              'Only to satisfy a paperwork requirement for the office.',
              'Because the operator manual cannot be used on site.',
              'To replace the need for a toolbox meeting.'
            ],
            correctIndex: 0,
            explanation: 'The signoff shows the learner has reviewed the PRA and understands the controls that must be in place before operating.'
          },
          {
            id: 'q2',
            question: 'What is the required control for visitors who may be struck if they stand too close to the rig?',
            options: [
              'Let them approach once drilling has started.',
              'Induct them to rig risks and keep the exclusion zone clear.',
              'Ask the driller to work faster so the exposure time is shorter.',
              'Use hand signals only after the visitor is inside the work area.'
            ],
            correctIndex: 1,
            explanation: 'The PRA specifically calls for visitor induction and a clear exclusion zone.'
          },
          {
            id: 'q3',
            question: 'What daily inspection tool is identified in the assessment for pre-shift checks?',
            options: [
              'ShiftTrack',
              'RigBoard',
              'QuipCheck',
              'PlantPass'
            ],
            correctIndex: 2,
            explanation: 'The risk assessment names QuipCheck as the daily pre-shift inspection and reporting tool.'
          },
          {
            id: 'q4',
            question: 'What should happen during lightning or other inclement weather?',
            options: [
              'Continue operating if the operator is wearing PPE.',
              'Lower the mast, isolate the machine, and pause work until conditions are suitable.',
              'Move the rig faster to get the task done.',
              'Only stop if the supervisor is already on site.'
            ],
            correctIndex: 1,
            explanation: 'The PRA directs the crew to fold down the mast and isolate the machine in inclement weather.'
          },
          {
            id: 'q5',
            question: 'What hearing control is required during machine operation?',
            options: [
              'No control is needed because the rig is below exposure limits.',
              'Operators can choose their own hearing practice.',
              'Hearing protection must be worn during operation.',
              'Only visitors need hearing protection.'
            ],
            correctIndex: 2,
            explanation: 'The assessment references noise up to 97 dBA and requires hearing protection during operation.'
          },
          {
            id: 'q6',
            question: 'Why is VOC important for P399 operators?',
            options: [
              'It proves the operator is trained and competent to manage the plant safely.',
              'It replaces the need for maintenance inspections.',
              'It is only needed when a visitor is present.',
              'It applies to supervisors only.'
            ],
            correctIndex: 0,
            explanation: 'The PRA identifies untrained or incompetent operation as a hazard and requires VOC with annual reassessment.'
          },
          {
            id: 'q7',
            question: 'If hydraulic fluid or diesel leaks onto hot exhaust components, what serious hazard can result?',
            options: [
              'Noise exposure',
              'Fire',
              'Ergonomic strain',
              'Loss of communication'
            ],
            correctIndex: 1,
            explanation: 'The fire section of the PRA specifically notes the risk of fluid contacting hot parts.'
          }
        ]
      })
    },
    create: {
      id: '00000000-0000-0000-0000-000000000002',
      title: 'P399 Plant Risk Assessment Review',
      mode: 'INDIVIDUAL',
      category: 'PLANT',
      description: 'Review the P399 Sonic Drilling Rig plant risk assessment, key hazards, current controls, and operator responsibilities before work starts.',
      learningObjectives: [
        'Identify the purpose of the P399 plant risk assessment and the signoff expectations before use.',
        'Recognise the main hazards and controls for the Geoprobe 8150LS Sonic Drilling Rig.',
        'Explain operator, supervisor, and visitor responsibilities identified in the assessment.',
        'Review understanding with an end-of-module quiz based on the real risk assessment.'
      ].join('\n'),
      estimatedMinutes: 25,
      contentBody: JSON.stringify({
        title: 'P399 Plant Risk Assessment Review',
        subtitle: 'Review the live plant risk assessment for the P399 Geoprobe 8150LS Sonic Drilling Rig before starting work.',
        slides: [
          {
            id: 'hero',
            type: 'hero',
            eyebrow: 'Plant category',
            title: 'Know the risk before you operate P399',
            body: 'This module walks the learner through the real plant risk assessment for the Sonic Drilling Rig so they can recognise hazards, confirm controls, and sign off with confidence.',
            meta: [
              'PRA Number 005',
              'Plant type: Sonic Drilling Rig',
              'Make / model: Geoprobe 8150LS',
              'Asset number: P399'
            ],
            fact: 'Risk = likelihood x consequence'
          },
          {
            id: 'signoff',
            type: 'checklist',
            eyebrow: 'Pre-start review',
            title: 'The assessment must be reviewed before use',
            checklist: [
              'Confirm the plant is designed to perform the task.',
              'Check whether the plant has been modified from OEM condition.',
              'Confirm the plant is in good working condition.',
              'Make sure action items from plant checks are closed out.',
              'Sign off only when the plant is safe to operate.'
            ]
          },
          {
            id: 'hazards',
            type: 'bullets',
            eyebrow: 'Key hazards',
            title: 'What can seriously hurt people around this rig?',
            bullets: [
              'Unexpected movement and people in the line of fire.',
              'Entanglement, crushing, trapping, cutting, and puncture hazards.',
              'Exposure to high-pressure hydraulic systems.',
              'Slips, trips, and falls around ancillary equipment or from climbing on the rig.',
              'Fire from hydraulic or diesel leaks contacting hot components.',
              'Weather, noise, and hazardous substances affecting safe operation.'
            ]
          },
          {
            id: 'controls',
            type: 'bullets',
            eyebrow: 'Controls in place',
            title: 'Current controls already required by the PRA',
            bullets: [
              'Operators must know the PRA, machine manual, signage, and rotary sonic rig JSA.',
              'Crew need clear line of sight, clear communication, and a pre-shift toolbox meeting.',
              'Visitors must be inducted and kept clear of the exclusion zone unless briefed.',
              'Routine maintenance, inspections, and annual component checks are required.',
              'Hearing protection is mandatory during operation.',
              'In bad weather, fold down the mast and isolate the machine.'
            ]
          },
          {
            id: 'follow-up',
            type: 'bullets',
            eyebrow: 'Ongoing requirements',
            title: 'What still has to happen after the PRA is issued?',
            bullets: [
              'Annual JSA review and refresher training.',
              'Annual VOC for operators.',
              'Daily pre-shift inspection using QuipCheck.',
              'Visitor briefing linked to the daily toolbox meeting.',
              'Fire extinguisher checks included in pre-start inspections.',
              'Hazardous substances register and MSDS sheets reviewed regularly.'
            ]
          },
          {
            id: 'ready-check',
            type: 'checklist',
            eyebrow: 'Before operating',
            title: 'Final readiness check for the learner',
            checklist: [
              'I know the task, plant, and main hazards.',
              'I have reviewed the PRA and JSA.',
              'Communication method and exclusion zones are clear.',
              'Pre-start checks, including QuipCheck, are complete.',
              'Required PPE is on and site/weather conditions are suitable.',
              'I know when to stop and escalate concerns.'
            ]
          }
        ],
        quiz: [
          {
            id: 'q1',
            question: 'Why must personnel review and sign off the P399 plant risk assessment before work starts?',
            options: [
              'To confirm they understand the hazards and controls for the task and plant.',
              'Only to satisfy a paperwork requirement for the office.',
              'Because the operator manual cannot be used on site.',
              'To replace the need for a toolbox meeting.'
            ],
            correctIndex: 0,
            explanation: 'The signoff shows the learner has reviewed the PRA and understands the controls that must be in place before operating.'
          },
          {
            id: 'q2',
            question: 'What is the required control for visitors who may be struck if they stand too close to the rig?',
            options: [
              'Let them approach once drilling has started.',
              'Induct them to rig risks and keep the exclusion zone clear.',
              'Ask the driller to work faster so the exposure time is shorter.',
              'Use hand signals only after the visitor is inside the work area.'
            ],
            correctIndex: 1,
            explanation: 'The PRA specifically calls for visitor induction and a clear exclusion zone.'
          },
          {
            id: 'q3',
            question: 'What daily inspection tool is identified in the assessment for pre-shift checks?',
            options: [
              'ShiftTrack',
              'RigBoard',
              'QuipCheck',
              'PlantPass'
            ],
            correctIndex: 2,
            explanation: 'The risk assessment names QuipCheck as the daily pre-shift inspection and reporting tool.'
          },
          {
            id: 'q4',
            question: 'What should happen during lightning or other inclement weather?',
            options: [
              'Continue operating if the operator is wearing PPE.',
              'Lower the mast, isolate the machine, and pause work until conditions are suitable.',
              'Move the rig faster to get the task done.',
              'Only stop if the supervisor is already on site.'
            ],
            correctIndex: 1,
            explanation: 'The PRA directs the crew to fold down the mast and isolate the machine in inclement weather.'
          },
          {
            id: 'q5',
            question: 'What hearing control is required during machine operation?',
            options: [
              'No control is needed because the rig is below exposure limits.',
              'Operators can choose their own hearing practice.',
              'Hearing protection must be worn during operation.',
              'Only visitors need hearing protection.'
            ],
            correctIndex: 2,
            explanation: 'The assessment references noise up to 97 dBA and requires hearing protection during operation.'
          },
          {
            id: 'q6',
            question: 'Why is VOC important for P399 operators?',
            options: [
              'It proves the operator is trained and competent to manage the plant safely.',
              'It replaces the need for maintenance inspections.',
              'It is only needed when a visitor is present.',
              'It applies to supervisors only.'
            ],
            correctIndex: 0,
            explanation: 'The PRA identifies untrained or incompetent operation as a hazard and requires VOC with annual reassessment.'
          },
          {
            id: 'q7',
            question: 'If hydraulic fluid or diesel leaks onto hot exhaust components, what serious hazard can result?',
            options: [
              'Noise exposure',
              'Fire',
              'Ergonomic strain',
              'Loss of communication'
            ],
            correctIndex: 1,
            explanation: 'The fire section of the PRA specifically notes the risk of fluid contacting hot parts.'
          }
        ]
      })
    }
  });

  // ── Competency mappings ───────────────────────────────────────
  for (const [competencyId, evidenceType] of [
    [dtFund.id,     'SESSION'],
    [dtFluids.id,   'QUIZ'],
    [dtHeave.id,    'SESSION'],
    [dtArtesian.id, 'QUIZ'],
  ]) {
    await prisma.moduleCompetency.upsert({
      where:  { moduleId_competencyId: { moduleId: mod.id, competencyId } },
      update: { evidenceType },
      create: { moduleId: mod.id, competencyId, evidenceType }
    });
  }

  console.log('Seed complete.');
  console.log('Users: Sean Templeton / Tom Lubbe / Greg Cossar');
  console.log('Module: Drilling Fundamentals (HYBRID) -- 8 sections');
  console.log('Module: P399 Plant Risk Assessment Review (INDIVIDUAL) -- Plant category with end-of-module quiz');
  console.log('  DT-FUND-01  -> SESSION');
  console.log('  DT-FLUID-01 -> QUIZ');
  console.log('  DT-HEAVE-01 -> SESSION');
  console.log('  DT-ART-01   -> QUIZ');
}

main()
  .then(()  => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
