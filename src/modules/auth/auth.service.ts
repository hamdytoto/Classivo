import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { compareHash } from '../../common/security/hash.utils';
import { getJwtAccessTokenConfig } from '../../common/security/jwt.utils';
import { LoginDto } from './dto/login.dto';

const AUTH_USER_SELECT = {
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
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  getStatus(): string {
    return 'auth module is ready';
  }

  async login(dto: LoginDto) {
    this.ensureSingleIdentifier(dto.email, dto.phone);

    const user = await this.prisma.user.findUnique({
      where: dto.email ? { email: dto.email } : { phone: dto.phone },
      select: {
        id: true,
        status: true,
        passwordHash: true,
      },
    });

    if (!user || !compareHash(dto.password, user.passwordHash)) {
      throw new UnauthorizedException({
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid login credentials',
      });
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        code: 'ACCOUNT_INACTIVE',
        message: 'Account is not active',
      });
    }

    const authenticatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      select: AUTH_USER_SELECT,
    });

    const jwtAccessConfig = getJwtAccessTokenConfig();
    const tokenPayload = {
      sub: authenticatedUser.id,
      schoolId: authenticatedUser.schoolId ?? null,
      email: authenticatedUser.email ?? null,
      phone: authenticatedUser.phone ?? null,
      status: authenticatedUser.status,
    };
    const accessToken = await this.jwtService.signAsync(tokenPayload, {
      secret: jwtAccessConfig.secret,
      expiresIn: jwtAccessConfig.expiresInSeconds,
      jwtid: randomUUID(),
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: jwtAccessConfig.expiresInSeconds,
      user: authenticatedUser,
    };
  }

  private ensureSingleIdentifier(email?: string, phone?: string): void {
    if (!email && !phone) {
      throw new BadRequestException({
        code: 'IDENTIFIER_REQUIRED',
        message: 'Either email or phone must be provided',
      });
    }

    if (email && phone) {
      throw new BadRequestException({
        code: 'IDENTIFIER_AMBIGUOUS',
        message: 'Provide only one of email or phone',
      });
    }
  }
}
