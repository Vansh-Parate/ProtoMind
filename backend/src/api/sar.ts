import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../core/prisma';
import { invalidateCase, invalidateCasesList } from '../core/cache';
import { LangChainLLMProvider, SarGenerationUnavailableError } from '../llm/provider';
import { generateSarForCase, updateSarEdits, approveSar, rejectSar } from '../services/sar';

export const sarRouter = Router();

const SarGenerateSchema = z.object({
  regenerate: z.boolean().optional()
});

const SarEditSchema = z.object({
  edited_text: z.string(),
  actor: z.string()
});

const SarApproveSchema = z.object({
  actor: z.string()
});

const SarRejectSchema = z.object({
  actor: z.string(),
  reason: z.string().optional()
});

sarRouter.post('/score/:caseId', async (req, res, next) => {
  try {
    const caseId = Number(req.params.caseId);
    const existing = await prisma.case.findUnique({ where: { id: caseId } });
    if (!existing) {
      res.status(404).json({ message: 'Case not found' });
      return;
    }
    res.json({
      case_id: existing.id,
      risk_score: existing.risk_score,
      risk_level: existing.risk_level,
      typology: existing.typology,
      confidence_score: existing.confidence_score,
      triggered_rules: existing.triggered_rules
    });
  } catch (err) {
    next(err);
  }
});

sarRouter.post('/generate-sar/:caseId', async (req, res, next) => {
  try {
    const caseId = Number(req.params.caseId);
    const { regenerate = false } = SarGenerateSchema.parse(req.body);
    const provider = new LangChainLLMProvider();
    const sar = await generateSarForCase({
      case_id: caseId,
      provider,
      regenerate,
      actor: 'system'
    });
    res.json(sar);
  } catch (err) {
    if (err instanceof Error && err.message === 'Case not found') {
      res.status(404).json({ message: err.message });
      return;
    }
    if (err instanceof SarGenerationUnavailableError) {
      res.status(503).json({ message: err.message });
      return;
    }
    next(err);
  }
});

sarRouter.get('/:caseId', async (req, res, next) => {
  try {
    const caseId = Number(req.params.caseId);
    const existing = await prisma.sARReport.findFirst({ where: { case_id: caseId } });
    if (!existing) {
      res.status(404).json({ message: 'SAR not found' });
      return;
    }
    res.json(existing);
  } catch (err) {
    next(err);
  }
});

sarRouter.put('/:caseId', async (req, res, next) => {
  try {
    const caseId = Number(req.params.caseId);
    const payload = SarEditSchema.parse(req.body);
    const updated = await updateSarEdits({
      case_id: caseId,
      edited_text: payload.edited_text,
      actor: payload.actor
    });
    invalidateCase(caseId);
    invalidateCasesList();
    res.json(updated);
  } catch (err) {
    if (err instanceof Error && /SAR not found/i.test(err.message)) {
      res.status(404).json({ message: err.message });
      return;
    }
    next(err);
  }
});

sarRouter.post('/approve/:caseId', async (req, res, next) => {
  try {
    const caseId = Number(req.params.caseId);
    const payload = SarApproveSchema.parse(req.body);
    const updated = await approveSar({ case_id: caseId, actor: payload.actor });
    invalidateCase(caseId);
    invalidateCasesList();
    res.json(updated);
  } catch (err) {
    if (err instanceof Error && /Case not found|SAR not found/i.test(err.message)) {
      res.status(404).json({ message: err.message });
      return;
    }
    next(err);
  }
});

sarRouter.post('/reject/:caseId', async (req, res, next) => {
  try {
    const caseId = Number(req.params.caseId);
    const payload = SarRejectSchema.parse(req.body);
    await rejectSar({ case_id: caseId, actor: payload.actor, reason: payload.reason });
    invalidateCase(caseId);
    invalidateCasesList();
    res.json({ status: 'REJECTED', case_id: caseId });
  } catch (err) {
    if (err instanceof Error && /Case not found/i.test(err.message)) {
      res.status(404).json({ message: err.message });
      return;
    }
    next(err);
  }
});

