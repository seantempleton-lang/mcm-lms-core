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
  await upsertUser('admin@example.com',      'Admin User',      'ADMIN',      'ChangeMe123!');
  await upsertUser('supervisor@example.com', 'Supervisor User', 'SUPERVISOR', 'ChangeMe123!');
  await upsertUser('learner@example.com',    'Learner User',    'LEARNER',    'ChangeMe123!');

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
    update: { title: 'Drilling Fundamentals', mode: 'HYBRID', description: JSON.stringify(moduleContent) },
    create: { id: '00000000-0000-0000-0000-000000000001', title: 'Drilling Fundamentals', mode: 'HYBRID', description: JSON.stringify(moduleContent) }
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
  console.log('Users: stempleton / tlubbe / gcossar + test accounts');
  console.log('Module: Drilling Fundamentals (HYBRID) -- 8 sections');
  console.log('  DT-FUND-01  -> SESSION');
  console.log('  DT-FLUID-01 -> QUIZ');
  console.log('  DT-HEAVE-01 -> SESSION');
  console.log('  DT-ART-01   -> QUIZ');
}

main()
  .then(()  => prisma.$disconnect())
  .catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });