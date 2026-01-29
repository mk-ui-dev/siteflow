import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { AppError, ErrorCode } from '@siteflow/shared';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async validateUser(userId: string) {
    const user = await this.prisma.users.findUnique({
      where: { id: userId, deletedAt: null, isActive: true },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found or inactive');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.prisma.users.findFirst({
      where: {
        email: email.toLowerCase(),
        deletedAt: null,
      },
      include: {
        tenant: true,
      },
    });

    if (!user) {
      throw new AppError(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        'Invalid email or password',
        401,
      );
    }

    const isPasswordValid = await argon2.verify(user.passwordHash, password);
    if (!isPasswordValid) {
      throw new AppError(
        ErrorCode.AUTH_INVALID_CREDENTIALS,
        'Invalid email or password',
        401,
      );
    }

    if (!user.isActive) {
      throw new AppError(
        ErrorCode.AUTH_FORBIDDEN,
        'User account is disabled',
        403,
      );
    }

    const accessToken = this.generateAccessToken(user.id, user.tenantId);
    const refreshToken = await this.generateRefreshToken(user.id);

    // Update last login
    await this.prisma.users.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      accessToken,
      refreshToken,
      user: this.serializeUser(user),
    };
  }

  async refreshAccessToken(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    const storedToken = await this.prisma.refreshTokens.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new AppError(
        ErrorCode.AUTH_TOKEN_INVALID,
        'Invalid or expired refresh token',
        401,
      );
    }

    const accessToken = this.generateAccessToken(
      storedToken.userId,
      storedToken.user.tenantId,
    );

    return {
      accessToken,
      user: this.serializeUser(storedToken.user),
    };
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);

    await this.prisma.refreshTokens.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  private generateAccessToken(userId: string, tenantId: string): string {
    return this.jwtService.sign(
      { sub: userId, tenantId },
      {
        secret: this.config.get<string>('jwt.secret'),
        expiresIn: this.config.get<string>('jwt.expiresIn'),
      },
    );
  }

  private async generateRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);

    const expiresIn = this.config.get<string>('jwt.refreshExpiresIn');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    await this.prisma.refreshTokens.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return token;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private serializeUser(user: any) {
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
