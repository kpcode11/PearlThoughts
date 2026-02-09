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
      await this.prisma.doctor.create({
        data: { userId: created.id, specialization: 'General', qualification: 'MBBS', experienceYears: 0, clinicAddress: '', consultationFee: 0 },
      });
    }

    return created;
  }

  async login(user: any) {
    const payload = { sub: user.id, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async findOrCreateFromGoogle(profile: any) {
    // profile contains emails, id, displayName
    const email = profile.emails?.[0]?.value;
    let user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      // create a patient by default
      user = await this.prisma.user.create({
        data: { fullName: profile.displayName ?? 'Google User', email, googleId: profile.id, role: 'patient' },
      });
      await this.prisma.patient.create({ data: { userId: user.id, age: 0, gender: 'other' } });
    } else if (!user.googleId) {
      user = await this.prisma.user.update({ where: { id: user.id }, data: { googleId: profile.id } });
    }
    return user;
  }
}
