import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './login.dto';
import { RegisterDto } from './register.dto';
import { VerifyOtpDto } from './verify-otp.dto';
import { ForgotPasswordDto } from './forgot-password.dto';
import { ResetPasswordDto } from './reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private notificationsService: NotificationsService,
    private auditService: AuditService,
    private prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    // Validate admin registration key
    if (dto.role === 'ADMINISTRATEUR_ARS') {
      const validKey = this.configService.get<string>('ADMIN_REGISTRATION_KEY');
      if (!dto.adminKey || dto.adminKey !== validKey) {
        throw new BadRequestException('Clé administrateur invalide');
      }
    }

    // Clean email (remove mailto: prefix if present)
    dto.email = dto.email.replace(/^mailto:/, '');
    
    // Validate organization if provided
    if (dto.organizationCode && dto.organizationJoinKey) {
      const orgId = await this.validateOrganizationAccess(
        dto.organizationCode,
        dto.organizationJoinKey,
      );
      if (!orgId) {
        throw new BadRequestException('Invalid organization code or join key');
      }
      dto.organizationId = orgId;
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const otp = this.generateOTP();
    
    // Remove organizationCode, organizationJoinKey, and adminKey before passing to user service
    const { organizationCode, organizationJoinKey, adminKey, ...userDto } = dto;
    
    const user = await this.usersService.create({
      ...userDto,
      password: hashedPassword,
      otpSecret: otp,
      otpEnabled: true,
    });

    await this.auditService.log(
      user.id,
      'USER_REGISTERED',
      'User',
      user.id,
      null,
      { email: user.email, role: user.role, organizationId: user.organizationId },
    );

    // Send OTP for account verification
    this.notificationsService.sendOTP(user.email, otp)
      .catch(err => console.error('Failed to send OTP email:', err.message));

    console.log('🔐 Registration OTP for', user.email, ':', otp);

    const { password, otpSecret, ...result } = user;
    return result;
  }

  private async validateOrganizationAccess(code: string, joinKey: string): Promise<string | null> {
    const org = await this.prisma.clientOrganization.findUnique({
      where: { code, isActive: true },
      select: { id: true, joinKey: true },
    });

    if (!org) return null;

    const isValid = await bcrypt.compare(joinKey, org.joinKey);
    return isValid ? org.id : null;
  }

  async login(dto: LoginDto) {
    // Clean email (remove mailto: prefix if present)
    dto.email = dto.email.replace(/^mailto:/, '');
    
    const user = await this.usersService.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      await this.auditService.log(
        undefined,
        'LOGIN_FAILED',
        'User',
        dto.email,
        null,
        { reason: 'Invalid credentials' },
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive. Please verify your email.');
    }

    // Direct login without OTP
    await this.auditService.log(
      user.id,
      'LOGIN_SUCCESS',
      'User',
      user.id,
      null,
      { email: user.email },
    );

    return this.generateTokens(user);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.usersService.findById(dto.userId);

    if (!user || user.otpSecret !== dto.otp) {
      await this.auditService.log(
        dto.userId,
        'OTP_VERIFICATION_FAILED',
        'User',
        dto.userId,
        null,
        { reason: 'Invalid OTP' },
      );
      throw new UnauthorizedException('Invalid OTP');
    }

    // Clear OTP
    await this.usersService.updateOtpSecret(user.id, null);
    
    // If account not active, activate it (registration flow)
    if (!user.isActive) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { 
          isActive: true,
          otpEnabled: false, // Disable OTP after registration verification
        },
      });

      await this.auditService.log(
        user.id,
        'ACCOUNT_VERIFIED',
        'User',
        user.id,
        null,
        { email: user.email },
      );

      // Send welcome email after verification
      this.notificationsService.notifyAccountCreated(user)
        .catch(err => console.error('Failed to send welcome email:', err.message));

      return { message: 'Account verified successfully' };
    }

    // Login flow - return tokens
    await this.auditService.log(
      user.id,
      'LOGIN_SUCCESS',
      'User',
      user.id,
      null,
      { email: user.email },
    );

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.usersService.findById(payload.sub);
      if (!user || !user.isActive) {
        throw new UnauthorizedException();
      }

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.auditService.log(
      userId,
      'LOGOUT',
      'User',
      userId,
      null,
      null,
    );
    return { message: 'Logged out successfully' };
  }

  private generateTokens(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION'),
    });

    const { password, otpSecret, ...userWithoutSensitive } = user;

    return {
      user: userWithoutSensitive,
      accessToken,
      refreshToken,
    };
  }

  private generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    
    if (!user) {
      return { message: 'If email exists, OTP has been sent' };
    }

    const otp = this.generateOTP();
    await this.usersService.updateOtpSecret(user.id, otp);
    
    // Send OTP without blocking
    this.notificationsService.sendOTP(user.email, otp)
      .catch(err => console.error('Failed to send OTP email:', err.message));

    console.log('🔐 Password reset OTP for', user.email, ':', otp); // Log OTP for development

    await this.auditService.log(
      user.id,
      'PASSWORD_RESET_REQUESTED',
      'User',
      user.id,
      null,
      { email: user.email },
    );

    return {
      userId: user.id,
      message: 'OTP sent to your email',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findById(dto.userId);

    if (!user || user.otpSecret !== dto.otp) {
      await this.auditService.log(
        dto.userId,
        'PASSWORD_RESET_FAILED',
        'User',
        dto.userId,
        null,
        { reason: 'Invalid OTP' },
      );
      throw new UnauthorizedException('Invalid OTP');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(dto.userId, hashedPassword);
    await this.usersService.updateOtpSecret(user.id, null);

    await this.auditService.log(
      user.id,
      'PASSWORD_RESET_SUCCESS',
      'User',
      user.id,
      null,
      { email: user.email },
    );

    return { message: 'Password reset successfully' };
  }

  async googleLogin(googleUser: any) {
    let user = await this.usersService.findByEmail(googleUser.email);

    if (!user) {
      const hashedPassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      user = await this.usersService.create({
        email: googleUser.email,
        password: hashedPassword,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
      });

      await this.auditService.log(
        user.id,
        'USER_REGISTERED_GOOGLE',
        'User',
        user.id,
        null,
        { email: user.email },
      );
    }

    await this.auditService.log(
      user.id,
      'LOGIN_SUCCESS_GOOGLE',
      'User',
      user.id,
      null,
      { email: user.email },
    );

    return this.generateTokens(user);
  }
}
