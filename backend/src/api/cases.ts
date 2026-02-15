import { Router } from 'express';
import { z } from 'zod';
import type { Case, SARReport } from '@prisma/client';
import { prisma } from '../core/prisma';
import {
  getCachedCasesList,
  setCachedCasesList,
  getCachedCaseDetail,
  setCachedCaseDetail,
  invalidateCasesList
} from '../core/cache';
import { AlertPayloadSchema } from '../scoring/engine';
import { createCaseFromAlert } from '../services/cases';

export const casesRouter = Router();

const CaseCreateSchema = z.object({
  alert: AlertPayloadSchema
});

function toSarCaseSummary(c: Case) {
  return {
    id: String(c.id),
    customerId: c.customer_id,
    typology: c.typology,
    risk: c.risk_level,
    status: c.status,
    createdAt: c.created_at.toISOString(),
    score: c.risk_score
  };
}

function toSarCaseDetail(c: Case & { sarReports: SARReport[] }) {
  const whyGenerated =
    (Array.isArray(c.triggered_rules)
      ? (c.triggered_rules as any[])
      : [])?.map((r) => String(r.description ?? '')) ?? [];

  const sar = c.sarReports[0];

  return {
    ...toSarCaseSummary(c),
    whyGenerated,
    narrativeGenerated: sar?.generated_text ?? '',
    narrativeEdited: sar?.edited_text ?? '',
    confidenceScore: c.confidence_score
  };
}

casesRouter.post('/', async (req, res, next) => {
  try {
    const { alert } = CaseCreateSchema.parse(req.body);
    const created = await createCaseFromAlert(alert);
    invalidateCasesList();
    res.status(201).json(toSarCaseSummary(created as unknown as Case));
  } catch (err) {
    next(err);
  }
});

casesRouter.get('/', async (_req, res, next) => {
  try {
    const cached = getCachedCasesList();
    if (cached) {
      return res.json(cached);
    }
    const cases = await prisma.case.findMany({
      orderBy: { created_at: 'desc' },
      take: 200
    });
    const payload = cases.map(toSarCaseSummary);
    setCachedCasesList(payload);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

casesRouter.get('/:caseId', async (req, res, next) => {
  try {
    const caseId = BigInt(req.params.caseId);
    const cached = getCachedCaseDetail(Number(caseId));
    if (cached) {
      return res.json(cached);
    }
    const existing = await prisma.case.findUnique({
      where: { id: caseId },
      include: {
        sarReports: {
          orderBy: { created_at: 'desc' },
          take: 1
        }
      }
    });

    if (!existing) {
      res.status(404).json({ message: 'Case not found' });
      return;
    }

    const payload = toSarCaseDetail(existing);
    setCachedCaseDetail(Number(caseId), payload);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

