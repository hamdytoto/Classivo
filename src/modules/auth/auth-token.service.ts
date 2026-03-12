import { randomUUID } from 'crypto';
import {
    BadRequestException,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    getJwtAccessTokenConfig,
    getJwtRefreshTokenConfig,
} from '../../common/security/jwt.utils';
import {
    AccessTokenPayload,
    AuthenticatedUser,
    RefreshTokenPayload,
} from './auth.types';

@Injectable()
export class AuthTokenService {
    constructor(private readonly jwtService: JwtService) { }

    async issueTokenPair(user: AuthenticatedUser, sessionId: string) {
        const accessConfig = getJwtAccessTokenConfig();
        const refreshConfig = getJwtRefreshTokenConfig();

        const accessPayload: AccessTokenPayload = {
            sub: user.id,
            schoolId: user.schoolId ?? null,
            email: user.email ?? null,
            phone: user.phone ?? null,
            status: user.status,
        };

        const refreshPayload: RefreshTokenPayload = {
            sub: user.id,
            sid: sessionId,
            type: 'refresh',
        };

        const [accessToken, refreshToken] = await Promise.all([
            this.jwtService.signAsync(accessPayload, {
                secret: accessConfig.secret,
                expiresIn: accessConfig.expiresInSeconds,
                jwtid: randomUUID(),
            }),
            this.jwtService.signAsync(refreshPayload, {
                secret: refreshConfig.secret,
                expiresIn: refreshConfig.expiresInSeconds,
                jwtid: randomUUID(),
            }),
        ]);

        return {
            accessToken,
            tokenType: 'Bearer' as const,
            expiresIn: accessConfig.expiresInSeconds,
            refreshToken,
            refreshExpiresIn: refreshConfig.expiresInSeconds,
        };
    }

    async verifyRefreshToken(refreshToken: string): Promise<RefreshTokenPayload> {
        const normalizedRefreshToken = refreshToken.trim();

        if (!normalizedRefreshToken) {
            throw new BadRequestException({
                code: 'REFRESH_TOKEN_REQUIRED',
                message: 'Refresh token is required',
            });
        }

        try {
            const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(
                normalizedRefreshToken,
                { secret: getJwtRefreshTokenConfig().secret },
            );

            if (!payload.sid || !payload.sub || payload.type !== 'refresh') {
                throw new UnauthorizedException({
                    code: 'INVALID_REFRESH_TOKEN',
                    message: 'Refresh token is invalid',
                });
            }

            return payload;
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            if (error instanceof UnauthorizedException) throw error;

            if (error instanceof Error && error.name === 'TokenExpiredError') {
                throw new UnauthorizedException({
                    code: 'REFRESH_TOKEN_EXPIRED',
                    message: 'Refresh token has expired',
                });
            }

            throw new UnauthorizedException({
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Refresh token is invalid',
            });
        }
    }

    buildExpiryDate(expiresInSeconds: number): Date {
        return new Date(Date.now() + expiresInSeconds * 1000);
    }
}
