import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DoctorService {
  constructor(private prisma: PrismaService) {}

  private async ensureDoctorForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'doctor') {
      throw new ForbiddenException('User is not a doctor');
    }
    const doctor = await this.prisma.doctor.findUnique({ where: { userId } });
    if (!doctor) {
      // create if missing (backwards compatibility)
      return await this.prisma.doctor.create({ data: { userId } });
    }
    return doctor;
  }

  async getProfile(userId: string) {
    const doctor = await this.ensureDoctorForUser(userId);
    const profile = await this.prisma.profile.findUnique({ where: { doctorId: doctor.id } });
    const specializations = await this.prisma.specialization.findMany({ where: { doctorId: doctor.id } });
    return { doctor, profile, specializations: specializations.map(s => s.name) };
  }

  async updateProfile(userId: string, dto: any) {
    const doctor = await this.ensureDoctorForUser(userId);
    const profile = await this.prisma.profile.upsert({
      where: { doctorId: doctor.id },
      create: { doctorId: doctor.id },
      update: {},
    });

    const updateData: any = {};
    if (dto.specialization !== undefined) updateData.specialization = dto.specialization;
    if (dto.qualification !== undefined) updateData.qualification = dto.qualification;
    if (dto.experienceYears !== undefined) updateData.experienceYears = dto.experienceYears;
    if (dto.clinicAddress !== undefined) updateData.clinicAddress = dto.clinicAddress;
    if (dto.consultationFee !== undefined) updateData.consultationFee = dto.consultationFee;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (Object.keys(updateData).length > 0) {
      await this.prisma.profile.update({ where: { id: profile.id }, data: updateData });
    }

    if (dto.specializations && Array.isArray(dto.specializations)) {
      await this.prisma.specialization.deleteMany({ where: { doctorId: doctor.id } });
      const data = dto.specializations.map((name: string) => ({ doctorId: doctor.id, name }));
      await this.prisma.specialization.createMany({ data });
    }

    if (dto.availabilityStatus !== undefined) {
      await this.prisma.doctor.update({ where: { id: doctor.id }, data: { availabilityStatus: dto.availabilityStatus } });
    }

    return this.getProfile(userId);
  }

  // slot management
  async listSlots(userId: string) {
    const doctor = await this.ensureDoctorForUser(userId);
    return this.prisma.availableSlot.findMany({ where: { doctorId: doctor.id } });
  }

  async createSlot(userId: string, dto: any) {
    const doctor = await this.ensureDoctorForUser(userId);
    const slot = await this.prisma.availableSlot.create({ data: { doctorId: doctor.id, ...dto } });
    return slot;
  }

  // appointment management for doctor
  async listAppointments(userId: string) {
    const doctor = await this.ensureDoctorForUser(userId);
    return this.prisma.appointment.findMany({
      where: { doctorId: doctor.id },
      include: { patient: { include: { user: true } }, slot: true },
    });
  }

  async cancelAppointment(userId: string, appointmentId: string) {
    const doctor = await this.ensureDoctorForUser(userId);
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.doctorId !== doctor.id) throw new BadRequestException('Not your appointment');
    if (appt.status === 'cancelled') return appt;

    await this.prisma.appointment.update({ where: { id: appointmentId }, data: { status: 'cancelled' } });
    await this.prisma.availableSlot.update({ where: { id: appt.slotId }, data: { isBooked: false } });

    // notify patient - placeholder
    console.log(`Doctor ${doctor.id} cancelled appointment ${appointmentId}`);
    return { success: true };
  }
}
