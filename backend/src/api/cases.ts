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
  const payload = (c.alert_payload as Record<string, any>) ?? {};

  // Synthesize transactions from flat CSV fields if standard array is missing
  if (!payload.transactions && payload.txn_amount) {
    payload.transactions = [{
      id: payload.txn_source_id || 'TXN-001',
      date: payload.txn_date,
      time: payload.txn_time,
      amount: payload.txn_amount,
      type: payload.txn_type,
      status: payload.txn_status,
      destination: payload.txn_destination_id,
      merchant: payload.merchant_id
    }];
  }

  const whyGenerated =
    (Array.isArray(c.triggered_rules)
      ? (c.triggered_rules as any[])
      : [])?.map((r) => String(r.description ?? '')) ?? [];

  // Add ML Risk Summary if available
  if (payload.ml_risk_summary) {
    whyGenerated.push(String(payload.ml_risk_summary));
  }

  const sar = c.sarReports[0];

  return {
    ...toSarCaseSummary(c),
    whyGenerated,
    narrativeGenerated: sar?.generated_text ?? '',
    narrativeEdited: sar?.edited_text ?? '',
    confidenceScore: c.confidence_score,
    alertPayload: payload
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

casesRouter.get('/', async (req, res, next) => {
  try {
    const pageParam = req.query.page ? Number(req.query.page) : undefined;
    const limitParam = req.query.limit ? Number(req.query.limit) : 500; // Increased default limit

    if (pageParam) {
      // Pagination mode
      const page = pageParam < 1 ? 1 : pageParam;
      const limit = limitParam;
      const skip = (page - 1) * limit;

      const [total, cases] = await prisma.$transaction([
        prisma.case.count(),
        prisma.case.findMany({
          orderBy: { created_at: 'desc' },
          skip,
          take: limit
        })
      ]);

      const payload = cases.map(toSarCaseSummary);
      // Construct paginated response
      return res.json({
        data: payload,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    }

    // Default mode: return array (all/limited items) for Dashboard/Legacy
    const cached = getCachedCasesList();
    if (cached) {
      return res.json(cached);
    }
    const cases = await prisma.case.findMany({
      orderBy: { created_at: 'desc' },
      take: 1000 // Limit to avoid massive payloads, but 500 fits
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
    const caseId = Number(req.params.caseId);
    const cached = getCachedCaseDetail(caseId);
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

    const payload = toSarCaseDetail(existing as Case & { sarReports: SARReport[] });
    setCachedCaseDetail(caseId, payload);
    res.json(payload);
  } catch (err) {
    next(err);
  }
});

