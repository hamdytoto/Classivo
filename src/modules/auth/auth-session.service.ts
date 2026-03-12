import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { hashToken } from '../../common/security/jwt.utils';
import { AUTH_USER_SELECT } from './auth.constants';
import { SessionContext } from './auth.types';

@Injectable()
export class AuthSessionService {
    constructor(private readonly prisma: PrismaService) { }

    async createSession(params: {
        sessionId: string;
        userId: string;
        refreshToken: string;
        expiresAt: Date;
        sessionContext?: SessionContext;
    }) {
        return this.prisma.session.create({
            data: {
                id: params.sessionId,
                userId: params.userId,
                refreshTokenHash: hashToken(params.refreshToken),
                ipAddress: params.sessionContext?.ipAddress ?? null,
                userAgent: params.sessionContext?.userAgent ?? null,
                expiresAt: params.expiresAt,
            },
        });
    }

    async findSessionWithUser(sessionId: string) {
        return this.prisma.session.findUnique({
            where: { id: sessionId },
            select: {
                id: true,
                userId: true,
                refreshTokenHash: true,
                expiresAt: true,
                revokedAt: true,
                user: {
                    select: AUTH_USER_SELECT,
                },
            },
        });
    }

    async findSession(sessionId: string) {
        return this.prisma.session.findUnique({
            where: { id: sessionId },
            select: {
                id: true,
                userId: true,
                refreshTokenHash: true,
                expiresAt: true,
                revokedAt: true,
            },
        });
    }

    async listActiveSessions(userId: string) {
        return this.prisma.session.findMany({
            where: {
                userId,
                revokedAt: null,
            },
            orderBy: [
                { updatedAt: 'desc' },
                { createdAt: 'desc' },
            ],
            select: {
                id: true,
                ipAddress: true,
                userAgent: true,
                expiresAt: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }

    async rotateSession(params: {
        sessionId: string;
        refreshToken: string;
        expiresAt: Date;
        sessionContext?: SessionContext;
    }) {
        return this.prisma.session.update({
            where: { id: params.sessionId },
            data: {
                refreshTokenHash: hashToken(params.refreshToken),
                expiresAt: params.expiresAt,
                ipAddress: params.sessionContext?.ipAddress ?? null,
                userAgent: params.sessionContext?.userAgent ?? null,
            },
        });
    }

    async revokeSession(sessionId: string): Promise<any> {
        await this.prisma.session.updateMany({
            where: {
                id: sessionId,
                revokedAt: null,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    assertRefreshTokenMatches(storedHash: string, refreshToken: string) {
        if (storedHash !== hashToken(refreshToken)) {
            throw new UnauthorizedException({
                code: 'REFRESH_TOKEN_REUSED',
                message: 'Refresh token reuse detected',
            });
        }
    }
}
