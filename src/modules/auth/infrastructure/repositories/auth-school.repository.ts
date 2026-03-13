import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../common/prisma/prisma.service';
import { SCHOOL_PUBLIC_SELECT } from '../../domain/auth.constants';

@Injectable()
export class AuthSchoolRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: { name: string; code: string },
    tx: Prisma.TransactionClient,
  ) {
    return tx.school.create({
      data,
      select: SCHOOL_PUBLIC_SELECT,
    });
  }
}
