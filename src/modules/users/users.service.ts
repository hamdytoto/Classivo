import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, type UserStatus } from '@prisma/client';
import { hash } from '../../common/security/hash.utils';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_PUBLIC_SELECT = {
  id: true,
  schoolId: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    this.ensureContactProvided(createUserDto.email, createUserDto.phone);
    await this.ensureSchoolExists(createUserDto.schoolId);

    const passwordHash = await hash(createUserDto.password);

    try {
      return await this.prisma.user.create({
        data: {
          schoolId: createUserDto.schoolId,
          email: createUserDto.email,
          phone: createUserDto.phone,
          passwordHash,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
          status: createUserDto.status,
        },
        select: USER_PUBLIC_SELECT,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async findAll(query: FindUsersQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = {};

    if (query.schoolId) {
      where.schoolId = query.schoolId;
    }

    if (query.status) {
      where.status = query.status as UserStatus;
    }

    if (query.email) {
      where.email = query.email;
    }

    if (query.phone) {
      where.phone = query.phone;
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: USER_PUBLIC_SELECT,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_PUBLIC_SELECT,
    });

    if (!user) {
      throw new NotFoundException(`User with id "${id}" not found`);
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const data: Prisma.UserUpdateInput = {};

    if (updateUserDto.email !== undefined) {
      data.email = updateUserDto.email;
    }

    if (updateUserDto.phone !== undefined) {
      data.phone = updateUserDto.phone;
    }

    if (updateUserDto.firstName !== undefined) {
      data.firstName = updateUserDto.firstName;
    }

    if (updateUserDto.lastName !== undefined) {
      data.lastName = updateUserDto.lastName;
    }

    if (updateUserDto.status !== undefined) {
      data.status = updateUserDto.status;
    }

    if (updateUserDto.password !== undefined) {
      data.passwordHash = await hash(updateUserDto.password);
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data,
        select: USER_PUBLIC_SELECT,
      });
    } catch (error) {
      this.handlePrismaError(error);
    }
  }

  async me(userId: string) {
    return this.findOne(userId);
  }

  private ensureContactProvided(email?: string, phone?: string): void {
    if (!email && !phone) {
      throw new BadRequestException({
        code: 'CONTACT_REQUIRED',
        message: 'Either email or phone must be provided',
      });
    }
  }

  private handlePrismaError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.join(', ')
          : 'unique field';
        throw new ConflictException({
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          message: `Duplicate value for ${target}`,
        });
      }

      if (error.code === 'P2025') {
        throw new NotFoundException({
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        });
      }

      if (error.code === 'P2003') {
        const fieldName =
          typeof error.meta?.field_name === 'string'
            ? error.meta.field_name
            : '';

        if (fieldName.includes('schoolId')) {
          throw new NotFoundException({
            code: 'INVALID_SCHOOL_ID',
            message: 'Invalid schoolId',
          });
        }

        throw new BadRequestException({
          code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
          message: 'Invalid related resource reference',
        });
      }
    }

    throw error;
  }

  private async ensureSchoolExists(schoolId?: string): Promise<void> {
    if (!schoolId) {
      return;
    }

    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true },
    });

    if (!school) {
      throw new NotFoundException({
        code: 'INVALID_SCHOOL_ID',
        message: 'Invalid schoolId',
      });
    }
  }
}
