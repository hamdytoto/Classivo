import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export type AuditLogInput = {
  action: string;
  resource: string;
  resourceId?: string | null;
  actorId?: string | null;
  schoolId?: string | null;
  ipAddress?: string | null;
  metadata?: Prisma.InputJsonValue | null;
};

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: AuditLogInput, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const data: Prisma.AuditLogUncheckedCreateInput = {
      action: input.action,
      resource: input.resource,
      resourceId: input.resourceId ?? null,
      actorId: input.actorId ?? null,
      schoolId: input.schoolId ?? null,
      ipAddress: input.ipAddress ?? null,
      ...(input.metadata !== undefined
        ? {
            metadata:
              input.metadata === null ? Prisma.JsonNull : input.metadata,
          }
        : {}),
    };

    return client.auditLog.create({
      data,
    });
  }
}
