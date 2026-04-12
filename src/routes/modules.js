import { Router } from 'express';
import { prisma } from '../prisma.js';
import { moduleCreateSchema, modulePatchSchema, moduleCompetenciesPutSchema } from '../validators.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { asyncHandler, mapPrismaError } from '../utils/http.js';

export const modulesRouter = Router();

modulesRouter.get('/', requireAuth, asyncHandler(async (req,res)=>{
  const items = await prisma.module.findMany({ include:{ competencies:{ include:{competency:true} } }, orderBy:{title:'asc'} });
  res.json(items);
}));

modulesRouter.post('/', requireAuth, requireRole('ADMIN'), asyncHandler(async (req,res)=>{
  const parsed=moduleCreateSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json(parsed.error.flatten());
  let item;
  try {
    item = await prisma.module.create({ data: parsed.data });
  } catch (error) {
    throw mapPrismaError(error, 'Failed to create module');
  }
  res.status(201).json(item);
}));

modulesRouter.patch('/:id', requireAuth, requireRole('ADMIN'), asyncHandler(async (req,res)=>{
  const parsed=modulePatchSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json(parsed.error.flatten());
  let item;
  try {
    item = await prisma.module.update({ where:{id:req.params.id}, data: parsed.data });
  } catch (error) {
    throw mapPrismaError(error, 'Failed to update module');
  }
  res.json(item);
}));

modulesRouter.put('/:id/competencies', requireAuth, requireRole('ADMIN'), asyncHandler(async (req,res)=>{
  const moduleId=req.params.id;
  const parsed=moduleCompetenciesPutSchema.safeParse(req.body);
  if(!parsed.success) return res.status(400).json(parsed.error.flatten());
  const items=parsed.data.items;
  try {
    await prisma.$transaction([
      prisma.moduleCompetency.deleteMany({ where:{ moduleId } }),
      prisma.moduleCompetency.createMany({ data: items.map(i=>({ moduleId, competencyId:i.competencyId, evidenceType:i.evidenceType })) })
    ]);
  } catch (error) {
    throw mapPrismaError(error, 'Failed to update module competencies');
  }
  const updated = await prisma.module.findUnique({ where:{id:moduleId}, include:{ competencies:{ include:{competency:true} } } });
  res.json(updated);
}));
