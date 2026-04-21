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

  const gtIntro = await prisma.competency.upsert({
    where:  { code: 'GT-INTRO-01' },
    update: {},
    create: {
      code:        'GT-INTRO-01',
      title:       'Introduction to Geotechnical Drilling',
      category:    'Geotech / Fundamentals',
      description: 'Explains the purpose of geotechnical drilling, the normal field workflow, and the behaviours that protect sample quality, traceability, and useful engineering outcomes.'
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

  const drillingFundamentalsDeck = {
    title: 'Drilling Fundamentals',
    subtitle: moduleContent.overview,
    slides: [
      {
        id: 'hero',
        type: 'hero',
        eyebrow: 'Geotechnical drilling',
        title: 'Drilling fundamentals for field crews',
        body: 'This module introduces the core ideas behind geotechnical drilling so learners understand why we drill, what can go wrong, and which controls to use in the field.',
        fact: '11 January 2023 | Christchurch',
        meta: [
          'Why we drill and what the client needs',
          'Common drilling problems and control levers',
          'Fluids, heave control, artesian pressure, and field tests'
        ]
      },
      {
        id: 'goals',
        type: 'bullets',
        eyebrow: 'Session goals',
        title: 'What this module is designed to do',
        bullets: [
          'Share practical drilling theory for day-to-day work.',
          'Provide tools and tricks that can be used in the field.',
          'Answer common questions operators and crews run into on site.'
        ]
      },
      {
        id: 'why-we-drill',
        type: 'bullets',
        eyebrow: 'Core concept',
        title: 'Why do we drill?',
        bullets: [
          'For core recovery, including specialised techniques like gel-push and Dames & Moore.',
          'For in-situ testing such as SPT.',
          'For water work including piezometers, wells, and infiltration tests.',
          'To install instrumentation such as inclos, VWPs, and extensometers.',
          'To enable another investigation technique, for example pre-drill for CPT.',
          'The client purpose matters because every drilling method involves trade-offs.'
        ]
      },
      {
        id: 'what-can-go-wrong',
        type: 'bullets',
        eyebrow: 'Risk awareness',
        title: 'What can go wrong during drilling?',
        bullets: [
          'Loss of core.',
          'Heave.',
          'Artesian flow.',
          'Stuck install or stuck casing.',
          'Damaged instrumentation.',
          'Rig problems on top of drilling issues.'
        ]
      },
      {
        id: 'combat-issues',
        type: 'bullets',
        eyebrow: 'Control levers',
        title: 'Ways to combat drilling issues',
        bullets: [
          'Prepare and circulate the right drilling fluid.',
          'Adjust mud viscosity and weight.',
          'Use the correct bit or shoe type, size, and wear condition.',
          'Tune speed variables: rotation, feed, hammer, and sonic frequency.',
          'Use overcasing or pre-drilling where appropriate.',
          'Choose the right support equipment and understand the ground conditions.'
        ]
      },
      {
        id: 'drilling-fluids',
        type: 'bullets',
        eyebrow: 'Fluids',
        title: 'What drilling fluids do for you',
        bullets: [
          'Water lubricates and cools the bit or shoe.',
          'Water, bentonite, and polymer can lubricate the drill string.',
          'Polymer helps maintain circulation and line the hole.',
          'Bentonite and barite help balance heave or artesian pressure.',
          'Polymer and bentonite lift cuttings to the surface.',
          'Effective cuttings transport depends on both viscosity and annular velocity.'
        ]
      },
      {
        id: 'fluid-equilibrium',
        type: 'checklist',
        eyebrow: 'DT focus',
        title: 'How to maintain fluid equilibrium and avoid heave',
        checklist: [
          'Treat fluid equilibrium as critical for all drilling methods.',
          'Be especially careful in DT drilling because the annulus is very small.',
          'Remove the spike or sample barrel very slowly.',
          'Continuously top up water or mud in the casing as you withdraw.',
          'Remember that if fluid level drops, ground pressure can cause heave.'
        ]
      },
      {
        id: 'artesian-pressure',
        type: 'bullets',
        eyebrow: 'Artesian pressure',
        title: 'Recognise and manage artesian pressure',
        bullets: [
          'Artesian pressure exists when the piezometric level of a confined aquifer is above ground surface.',
          'It only occurs in confined aquifers with an aquitard above, such as silt or clay.',
          'Temporary control can be achieved with weighted mud if the mud column is stable.',
          'Use the formula: (head above ground + casing depth) / casing depth = SG required.',
          'Worked example: 20 m casing depth and 2 m head gives SG 1.1.',
          'Always treat weighted mud as temporary control and escalate when needed.'
        ]
      },
      {
        id: 'field-tests',
        type: 'bullets',
        eyebrow: 'Field tests',
        title: 'What to monitor with mud balance, Marsh funnel, and pH',
        bullets: [
          'Mud scales measure drilling fluid density in g/cm3 or kg/m3.',
          'The Marsh funnel is a time-based viscosity indicator; fresh water is 26 seconds.',
          'Typical mud ranges from 30 to 90 seconds depending on ground conditions.',
          'Medium sand generally needs a higher viscosity than fine sand.',
          'Trending readings matters more than relying on a single measurement.',
          'Soda ash is used to condition water chemistry and must be handled with the correct PPE.'
        ]
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: 'Why is it important to understand the client’s purpose before drilling?',
        options: [
          'Because the client purpose changes the best drilling approach and trade-offs.',
          'Because it only affects paperwork after drilling is complete.',
          'Because it determines who signs the fuel sheet.',
          'Because it removes the need to understand the ground conditions.'
        ],
        correctIndex: 0,
        explanation: 'The module stresses that the reason for drilling drives method selection and the compromises that come with it.'
      },
      {
        id: 'q2',
        question: 'Which of the following is identified as a common drilling problem?',
        options: [
          'Perfect core recovery every run',
          'Heave',
          'Lower fuel costs',
          'Faster internet in the rig'
        ],
        correctIndex: 1,
        explanation: 'The training explicitly lists heave as one of the key things that can go wrong during drilling.'
      },
      {
        id: 'q3',
        question: 'What two things both matter for transporting cuttings effectively?',
        options: [
          'Viscosity and annular velocity',
          'Fuel level and tyre pressure',
          'Hammer size and paint colour',
          'Operator age and shift length'
        ],
        correctIndex: 0,
        explanation: 'The drilling fluids section notes that viscosity alone is not enough; annular velocity matters too.'
      },
      {
        id: 'q4',
        question: 'Why is fluid equilibrium especially critical in DT drilling?',
        options: [
          'Because DT drilling has a very small annulus.',
          'Because DT drilling does not use water.',
          'Because DT rigs cannot be cased.',
          'Because DT drilling removes the need for mud.'
        ],
        correctIndex: 0,
        explanation: 'The lesson calls out the small annulus in DT systems as the reason fluid level changes become especially sensitive.'
      },
      {
        id: 'q5',
        question: 'What is the correct first response when artesian pressure is identified?',
        options: [
          'Ignore it unless water is visible',
          'Treat weighted mud as temporary control only and escalate when needed',
          'Continue drilling faster to get through it',
          'Rely only on the Marsh funnel result'
        ],
        correctIndex: 1,
        explanation: 'The training says weighted mud can be used temporarily, but artesian pressure should still be escalated rather than self-managed indefinitely.'
      },
      {
        id: 'q6',
        question: 'What is the fresh water baseline for a Marsh funnel reading?',
        options: [
          '12 seconds',
          '26 seconds',
          '55 seconds',
          '90 seconds'
        ],
        correctIndex: 1,
        explanation: 'The module notes that fresh water is 26 seconds using the quart standard.'
      }
    ]
  };

  const geotechIntroDeck = {
    title: 'Introduction to Geotechnical Drilling',
    subtitle: 'A foundation module for new learners covering why geotechnical drilling is done, how a typical job runs, and what field discipline protects useful project outcomes.',
    slides: [
      {
        id: 'hero',
        type: 'hero',
        eyebrow: 'Geotechnical drilling',
        title: 'Introduction to geotechnical drilling',
        body: 'Geotechnical drilling is not just about making a hole. The job is to recover dependable information about the ground so engineers, geologists, and clients can make better decisions about design, construction, and risk.',
        fact: 'Ground data with purpose',
        meta: [
          'Why geotechnical drilling is commissioned',
          'What the field team needs to recover and record',
          'How good field habits protect the value of the job'
        ]
      },
      {
        id: 'purpose',
        type: 'content',
        eyebrow: 'Purpose',
        title: 'Why clients commission geotechnical drilling',
        body: 'Geotechnical drilling supports investigations for foundations, earthworks, pavements, retaining structures, slope stability, instrumentation, and construction planning. The client is paying for reliable ground information, not simply drilled depth, so sample quality and accurate field records matter from the first run onward.',
        meta: [
          'Supports design and planning',
          'Reduces uncertainty in the ground model',
          'Turns field observations into usable evidence'
        ]
      },
      {
        id: 'workflow',
        type: 'bullets',
        eyebrow: 'Workflow',
        title: 'What a normal geotechnical drilling job looks like',
        bullets: [
          'Review the scope, bore location, access, permits, and service information before mobilising.',
          'Set up the rig safely and confirm the planned method, tooling, and depth control.',
          'Advance the hole while monitoring drilling response, groundwater, and changing ground conditions.',
          'Recover samples carefully and keep every interval identifiable and traceable.',
          'Log observations promptly and hand over records in a form others can interpret.'
        ],
        fact: 'Plan, set up, drill, recover, record'
      },
      {
        id: 'outputs',
        type: 'bullets',
        eyebrow: 'Outputs',
        title: 'What the engineer and client rely on from the field team',
        bullets: [
          'Correct bore location, interval control, and depth accuracy.',
          'Representative samples that have not been mixed, damaged, or mislabelled.',
          'Clear notes on strata changes, sample recovery, groundwater, and drilling behaviour.',
          'Prompt escalation when unexpected conditions affect safety, method, or data quality.',
          'Consistent sample identification and storage so later interpretation remains trustworthy.'
        ],
        fact: 'Quality leaves the site with the samples and notes'
      },
      {
        id: 'habits',
        type: 'checklist',
        eyebrow: 'Field discipline',
        title: 'Daily habits that protect geotechnical quality',
        checklist: [
          'Confirm the task, expected sample type, and interval before starting the run.',
          'Keep the work area controlled and raise changing ground conditions early.',
          'Handle samples carefully and maintain clear depth and box identification.',
          'Record observations while they are fresh rather than from memory later.',
          'Escalate poor recovery, instability, or uncertainty before the hole quality is compromised.'
        ],
        meta: [
          'Safe work',
          'Reliable samples',
          'Accurate records'
        ]
      },
      {
        id: 'why-discipline-matters',
        type: 'content',
        eyebrow: 'Why it matters',
        title: 'Small field errors can weaken the whole investigation',
        body: 'If samples are mixed, depths drift, groundwater observations are missed, or logs are delayed, the final ground model can become less reliable. That can lead to rework, reduce client confidence, and make engineering decisions harder. Consistent field discipline is what turns drilling activity into dependable geotechnical information.',
        fact: 'Accuracy before speed',
        tone: 'warning',
        meta: [
          'Protect the ground model',
          'Reduce avoidable rework',
          'Keep decisions evidence-based'
        ]
      }
    ],
    quiz: [
      {
        id: 'q1',
        question: 'What is the main purpose of geotechnical drilling?',
        options: [
          'To collect dependable ground information that supports engineering and construction decisions',
          'To drill as quickly as possible regardless of sample quality',
          'To replace the design work completed by engineers',
          'To avoid the need for field records'
        ],
        correctIndex: 0,
        explanation: 'Geotechnical drilling is valuable because it produces reliable information about subsurface conditions, not just drilled metres.'
      },
      {
        id: 'q2',
        question: 'Which sequence best reflects a normal geotechnical drilling workflow?',
        options: [
          'Plan, set up, drill, recover samples, and record observations',
          'Drive to site, drill fast, and write the notes later from memory',
          'Recover samples first, then choose the bore location',
          'Install instrumentation before checking access and services'
        ],
        correctIndex: 0,
        explanation: 'A controlled job runs from planning through setup, drilling, recovery, and timely recording.'
      },
      {
        id: 'q3',
        question: 'Why is sample identification important?',
        options: [
          'It keeps each recovered interval traceable to the correct hole and depth',
          'It mainly makes the boxes look tidy for storage',
          'It removes the need for bore logging',
          'It only matters after the project is complete'
        ],
        correctIndex: 0,
        explanation: 'Traceability allows later reviewers to trust that each sample came from the recorded interval.'
      },
      {
        id: 'q4',
        question: 'What should happen if drilling response or ground conditions change unexpectedly?',
        options: [
          'Raise it early so the team can review safety, method, and data quality impacts',
          'Keep going and mention it at the end of the week',
          'Ignore it unless recovery reaches zero',
          'Only record it if the client is watching'
        ],
        correctIndex: 0,
        explanation: 'Unexpected ground conditions can affect safety and the value of the investigation, so they should be escalated promptly.'
      },
      {
        id: 'q5',
        question: 'Why are timely field notes important?',
        options: [
          'Because details are lost and less reliable if they are written much later',
          'Because clients prefer longer reports',
          'Because logging is optional once the samples are boxed',
          'Because it replaces the need for competency signoff'
        ],
        correctIndex: 0,
        explanation: 'Prompt notes preserve the details that make samples and field observations useful to others.'
      }
    ]
  };

  // ── Module upsert ─────────────────────────────────────────────
  const mod = await prisma.module.upsert({
    where:  { id: '00000000-0000-0000-0000-000000000001' },
    update: {
      title: 'Drilling Fundamentals',
      mode: 'HYBRID',
      category: 'GEOTECH',
      description: moduleContent.overview,
      learningObjectives: [
        'Understand why geotechnical drilling is performed and how client objectives shape method selection.',
        'Recognise common drilling problems and the main control levers used in the field.',
        'Explain how drilling fluids, fluid equilibrium, and artesian pressure affect safe drilling outcomes.',
        'Review understanding with an end-of-module quiz.'
      ].join('\n'),
      estimatedMinutes: 30,
      contentBody: JSON.stringify(drillingFundamentalsDeck)
    },
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Drilling Fundamentals',
      mode: 'HYBRID',
      category: 'GEOTECH',
      description: moduleContent.overview,
      learningObjectives: [
        'Understand why geotechnical drilling is performed and how client objectives shape method selection.',
        'Recognise common drilling problems and the main control levers used in the field.',
        'Explain how drilling fluids, fluid equilibrium, and artesian pressure affect safe drilling outcomes.',
        'Review understanding with an end-of-module quiz.'
      ].join('\n'),
      estimatedMinutes: 30,
      contentBody: JSON.stringify(drillingFundamentalsDeck)
    }
  });

  const geotechIntroModule = await prisma.module.upsert({
    where:  { id: '00000000-0000-0000-0000-000000000003' },
    update: {
      title: 'Introduction to Geotechnical Drilling',
      mode: 'INDIVIDUAL',
      category: 'GEOTECH',
      description: 'Introduces new learners to what geotechnical drilling is, why clients commission it, and the field behaviours that protect sample quality, safety, and useful project outcomes.',
      learningObjectives: [
        'Explain the purpose of geotechnical drilling in simple operational terms.',
        'Describe the typical sequence of a geotechnical drilling job from planning to handover.',
        'Recognise the field behaviours that support safe work, reliable samples, and accurate records.'
      ].join('\n'),
      estimatedMinutes: 26,
      contentBody: JSON.stringify(geotechIntroDeck)
    },
    create: {
      id: '00000000-0000-0000-0000-000000000003',
      title: 'Introduction to Geotechnical Drilling',
      mode: 'INDIVIDUAL',
      category: 'GEOTECH',
      description: 'Introduces new learners to what geotechnical drilling is, why clients commission it, and the field behaviours that protect sample quality, safety, and useful project outcomes.',
      learningObjectives: [
        'Explain the purpose of geotechnical drilling in simple operational terms.',
        'Describe the typical sequence of a geotechnical drilling job from planning to handover.',
        'Recognise the field behaviours that support safe work, reliable samples, and accurate records.'
      ].join('\n'),
      estimatedMinutes: 26,
      contentBody: JSON.stringify(geotechIntroDeck)
    }
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

  await prisma.moduleCompetency.upsert({
    where:  { moduleId_competencyId: { moduleId: geotechIntroModule.id, competencyId: gtIntro.id } },
    update: { evidenceType: 'QUIZ' },
    create: { moduleId: geotechIntroModule.id, competencyId: gtIntro.id, evidenceType: 'QUIZ' }
  });

  console.log('Seed complete.');
  console.log('Users: Sean Templeton / Tom Lubbe / Greg Cossar');
  console.log('Module: Drilling Fundamentals (HYBRID) -- 8 sections');
  console.log('Module: Introduction to Geotechnical Drilling (INDIVIDUAL) -- learner foundation module with end-of-module quiz');
  console.log('Module: P399 Plant Risk Assessment Review (INDIVIDUAL) -- Plant category with end-of-module quiz');
  console.log('  GT-INTRO-01 -> QUIZ');
  console.log('  DT-FUND-01  -> SESSION');
  console.log('  DT-FLUID-01 -> QUIZ');
  console.log('  DT-HEAVE-01 -> SESSION');
  console.log('  DT-ART-01   -> QUIZ');
}

main()
  .then(()  => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
