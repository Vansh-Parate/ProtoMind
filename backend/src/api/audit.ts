import { Router } from 'express';
import { prisma } from '../core/prisma';

export const auditRouter = Router();

auditRouter.get('/:caseId', async (req, res, next) => {
  try {
    const caseId = Number(req.params.caseId);
    const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existingCase) {
      res.status(404).json({ message: 'Case not found' });
      return;
    }

    const logs = await prisma.auditLog.findMany({
      where: { case_id: caseId },
      orderBy: { timestamp: 'asc' }
    });

    res.json(logs);
  } catch (err) {
    next(err);
  }
});

