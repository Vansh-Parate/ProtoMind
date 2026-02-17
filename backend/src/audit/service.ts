import { Prisma } from '@prisma/client';
import { prisma } from '../core/prisma';

export async function logAuditEvent(params: {
  case_id: number | bigint;
  action: string;
  actor: string;
  input_snapshot?: Prisma.InputJsonValue;
  output_snapshot?: Prisma.InputJsonValue;
}) {
  const { case_id, action, actor, input_snapshot, output_snapshot } = params;

  await prisma.auditLog.create({
    data: {
      case_id,
      action,
      actor,
      input_snapshot,
      output_snapshot
    }
  });
}

