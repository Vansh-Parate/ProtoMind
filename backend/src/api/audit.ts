import { Router } from 'express';
import { prisma } from '../core/prisma';
import { getCachedAudit, setCachedAudit } from '../core/cache';

export const auditRouter = Router();

auditRouter.get('/:caseId', async (req, res, next) => {
  try {
    const caseId = BigInt(req.params.caseId);
    const cached = getCachedAudit(Number(caseId));
    if (cached) {
      return res.json(cached);
    }

    const existingCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existingCase) {
      res.status(404).json({ message: 'Case not found' });
      return;
    }

    const logs = await prisma.auditLog.findMany({
      where: { case_id: caseId },
      orderBy: { timestamp: 'asc' }
    });

    setCachedAudit(Number(caseId), logs);
    res.json(logs);
  } catch (err) {
    next(err);
  }
});

