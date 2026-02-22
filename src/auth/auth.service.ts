import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async validateUserByEmailOrPhone(identifier: string, pass: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { phone: identifier }],
      },
    });
    if (!user || !user.passwordHash) return null;
    const isValid = await bcrypt.compare(pass, user.passwordHash);
    if (!isValid) return null;
    return user;
  }

  async signup(dto: SignupDto) {
    // If password is provided, hash it.
    let passwordHash: string | null = null;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    // Create user
    const created = await this.prisma.user.create({
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
      },
    });

    // create patient or doctor row if needed
    if (dto.role === 'patient') {
      await this.prisma.patient.create({ data: { userId: created.id, age: 0, gender: 'other' } });
    } else {
      const doctor = await this.prisma.doctor.create({ data: { userId: created.id } });
      // also create blank profile so relation exists
      await this.prisma.profile.create({ data: { doctorId: doctor.id } });
    }

    return created;
  }

  async login(user: any) {
    const payload = { sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async findOrCreateFromGoogle(profile: any, role: 'patient' | 'doctor' = 'patient') {
    // profile contains emails, id, displayName
    const email = profile.emails?.[0]?.value;
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // create with requested role
      user = await this.prisma.user.create({
        data: {
          fullName: profile.displayName ?? 'Google User',
          email,
          googleId: profile.id,
          role,
          isEmailVerified: true, // google verified
        },
      });
      if (role === 'patient') {
        await this.prisma.patient.create({ data: { userId: user.id, age: 0, gender: 'other' } });
      } else {
        const doctor = await this.prisma.doctor.create({ data: { userId: user.id } });
        await this.prisma.profile.create({ data: { doctorId: doctor.id } });
      }
    } else if (!user.googleId) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: { googleId: profile.id } });
    }
    return user;
  }

  // create a token for verification or onboarding
  async createVerificationToken(userId: string, type: 'email' | 'phone' | 'onboard') {
    const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await this.prisma.verificationToken.create({
      data: { userId, type, token, expiresAt },
    });
    // in real world send via email/sms
    console.log(`verification token for ${type} (user ${userId}): ${token}`);
    return token;
  }

  async verifyToken(token: string, type: 'email' | 'phone') {
    const record = await this.prisma.verificationToken.findFirst({
      where: { token, type, expiresAt: { gte: new Date() } },
    });
    if (!record) return false;
    // update user
    const data: any = {};
    if (type === 'email') data.isEmailVerified = true;
    if (type === 'phone') data.isPhoneVerified = true;
    await this.prisma.user.update({ where: { id: record.userId }, data });
    // cleanup
    await this.prisma.verificationToken.delete({ where: { id: record.id } });
    return true;
  }

  async completeOnboarding(userId: string, dto: any) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    if (user.role === 'patient') {
      await this.prisma.patient.update({ where: { userId }, data: { age: dto.age ?? undefined, gender: dto.gender ?? undefined } });
    } else {
      // update doctor's profile
      const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
      if (!doctor) throw new UnauthorizedException();
      // ensure profile exists
      await this.prisma.profile.upsert({
        where: { doctorId: doctor.id },
        update: {
          specialization: dto.specialization ?? undefined,
          qualification: dto.qualification ?? undefined,
          experienceYears: dto.experienceYears ?? undefined,
          clinicAddress: dto.clinicAddress ?? undefined,
          consultationFee: dto.consultationFee ?? undefined,
        },
        create: {
          doctorId: doctor.id,
          specialization: dto.specialization,
          qualification: dto.qualification,
          experienceYears: dto.experienceYears,
          clinicAddress: dto.clinicAddress,
          consultationFee: dto.consultationFee,
        },
      });

      // optionally handle multiple specializations list
      if (dto.specializations && Array.isArray(dto.specializations)) {
        // simple strategy: delete existing and re-create
        await this.prisma.specialization.deleteMany({ where: { doctorId: doctor.id } });
        const specsData = dto.specializations.map((name: string) => ({ doctorId: doctor.id, name }));
        await this.prisma.specialization.createMany({ data: specsData });
      }
    }
    await this.prisma.user.update({ where: { id: userId }, data: { isOnboarded: true } });
    return true;
  }
}
