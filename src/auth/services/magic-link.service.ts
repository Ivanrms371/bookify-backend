import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcryptjs';
import { AuthContext } from '../types/auth-context.type';
import { UserService } from 'src/modules/users/services/user.service';
import { SessionService } from './session.service';

const MAGIC_LINK_EXPIRATION_MINUTES = 15;
const MAGIC_LINK_BASE_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

@Injectable()
export class MagicLinkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
  ) {}

  /**
   * Generate a magic link for a given email
   * Creates or finds user, generates token, stores it in DB
   */
  async generateMagicLink(email: string, ctx: AuthContext): Promise<{ message: string }> {
    // Generate a random token (32 bytes = 64 hex characters)
    const token = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);

    const expiresAt = new Date(Date.now() + MAGIC_LINK_EXPIRATION_MINUTES * 60 * 1000);

    // Store the magic link in the database
    await this.prisma.magicLink.create({
      data: {
        email: email.toLowerCase(),
        tokenHash,
        ipAddress: ctx.ip ?? null,
        expiresAt,
      },
    });

    // Send email with magic link (using Resend)
    const magicLinkUrl = `${MAGIC_LINK_BASE_URL}/auth/verify-magic-link/${token}`;

    // TODO: Send email via Resend service
    // await this.emailService.sendMagicLinkEmail(email, magicLinkUrl);

    console.log(`[MAGIC LINK] Token for ${email}: ${magicLinkUrl}`);

    return {
      message: 'Hemos enviado un link de acceso a tu email. Revisa tu bandeja de entrada.',
    };
  }

  /**
   * Validate a magic link token and authenticate the user
   * Auto-creates user if doesn't exist (customer flow)
   */
  async validateMagicLink(token: string, ctx: AuthContext) {
    // Find all non-expired, non-used magic links
    const magicLinks = await this.prisma.magicLink.findMany({
      where: {
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    // Find the matching token
    let matchedLink: (typeof magicLinks)[0] | null = null;
    for (const link of magicLinks) {
      const isValid = await bcrypt.compare(token, link.tokenHash);
      if (isValid) {
        matchedLink = link;
        break;
      }
    }

    if (!matchedLink) {
      throw new UnauthorizedException('El link no es válido o ha expirado');
    }

    // Mark link as used
    await this.prisma.magicLink.update({
      where: { id: matchedLink.id },
      data: { usedAt: new Date() },
    });

    // Find or create user
    let user = await this.userService.findByEmail(matchedLink.email);

    if (!user) {
      // Auto-create user for customer (magic link flow)
      user = await this.userService.create({
        email: matchedLink.email,
        name: matchedLink.email.split('@')[0], // Use email prefix as default name
        emailVerifiedAt: new Date(), // Auto-verify email for magic link users
      });
    }

    // Generate session
    const session = await this.sessionService.generateUserSession(user, ctx);
    return session;
  }

  /**
   * Clean up expired magic links (run periodically)
   */
  async cleanupExpiredLinks() {
    const deleted = await this.prisma.magicLink.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return deleted;
  }
}
