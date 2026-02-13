import { prisma } from '../core/prisma';
import { logAuditEvent } from '../audit/service';
import { LLMProvider } from '../llm/provider';
import { scoreAlert } from '../scoring/engine';
import { detectTypology } from '../typologies/detector';

export async function generateSarForCase(params: {
  case_id: number;
  provider: LLMProvider;
  regenerate?: boolean;
  actor?: string;
}) {
  const { case_id, provider, regenerate = false, actor = 'system' } = params;

  const existingCase = await prisma.case.findUnique({
    where: { id: case_id }
  });
  if (!existingCase) {
    throw new Error('Case not found');
  }

  const existingSar = await prisma.sARReport.findFirst({
    where: { case_id }
  });

  if (existingSar && !regenerate) {
    return existingSar;
  }

  const score = scoreAlert(existingCase.alert_payload as any);
  const typology = detectTypology(existingCase.alert_payload as any, score.risk_level);

  const generated_text = await provider.generateSar({
    case_id,
    alert_payload: existingCase.alert_payload as any,
    score,
    typology
  });

  const sar = existingSar
    ? await prisma.sARReport.update({
        where: { id: existingSar.id },
        data: {
          generated_text,
          edited_text: null,
          approved_by: null,
          approved_at: null
        }
      })
    : await prisma.sARReport.create({
        data: {
          case_id,
          generated_text
        }
      });

  await logAuditEvent({
    case_id,
    action: 'SAR_GENERATED',
    actor,
    input_snapshot: { case_id },
    output_snapshot: { sar_id: sar.id }
  });

  return sar;
}

export async function updateSarEdits(params: {
  case_id: number;
  edited_text: string;
  actor: string;
}) {
  const { case_id, edited_text, actor } = params;

  const existingSar = await prisma.sARReport.findFirst({
    where: { case_id }
  });
  if (!existingSar) {
    throw new Error('SAR not found for case');
  }

  const updated = await prisma.sARReport.update({
    where: { id: existingSar.id },
    data: { edited_text }
  });

  await logAuditEvent({
    case_id,
    action: 'SAR_EDITED',
    actor,
    output_snapshot: { sar_id: updated.id }
  });

  return updated;
}

export async function approveSar(params: { case_id: number; actor: string }) {
  const { case_id, actor } = params;

  const existingCase = await prisma.case.findUnique({ where: { id: case_id } });
  if (!existingCase) {
    throw new Error('Case not found');
  }

  const existingSar = await prisma.sARReport.findFirst({ where: { case_id } });
  if (!existingSar) {
    throw new Error('SAR not found for case');
  }

  const sar = await prisma.sARReport.update({
    where: { id: existingSar.id },
    data: {
      approved_by: actor,
      approved_at: new Date()
    }
  });

  await prisma.case.update({
    where: { id: case_id },
    data: { status: 'APPROVED' }
  });

  await logAuditEvent({
    case_id,
    action: 'SAR_APPROVED',
    actor,
    output_snapshot: { sar_id: sar.id }
  });

  return sar;
}

export async function rejectSar(params: { case_id: number; actor: string; reason?: string }) {
  const { case_id, actor, reason } = params;

  const existingCase = await prisma.case.findUnique({ where: { id: case_id } });
  if (!existingCase) {
    throw new Error('Case not found');
  }

  await prisma.case.update({
    where: { id: case_id },
    data: { status: 'REJECTED' }
  });

  await logAuditEvent({
    case_id,
    action: 'SAR_REJECTED',
    actor,
    input_snapshot: reason ? { reason } : undefined
  });
}

