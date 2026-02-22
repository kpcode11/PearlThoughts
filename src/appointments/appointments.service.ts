import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async listDoctors(specialization?: string) {
    const where: any = {};
    if (specialization) {
      where.specialization = specialization;
    }
    const doctors = await this.prisma.doctor.findMany({
      where,
      include: { user: { select: { fullName: true, email: true } }, slots: true },
    });
    return doctors.map(d => ({
      id: d.id,
      fullName: d.user.fullName,
      email: d.user.email,
      specialization: d.specialization,
      availabilityStatus: d.availabilityStatus,
      slots: d.slots,
    }));
  }

  // internally we always work with the patient row, not the auth user id
  private async getPatientIdForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== 'patient') {
      throw new BadRequestException('Only patient users can perform this action');
    }

    let patient = await this.prisma.patient.findUnique({ where: { userId } });
    if (!patient) {
      // if the patient row is missing (old data, signup via google etc), create one with defaults
      patient = await this.prisma.patient.create({ data: { userId, age: 0, gender: 'other' } });
    }
    return patient.id;
  }

  async bookAppointment(userId: string, dto: any) {
    const patientId = await this.getPatientIdForUser(userId);
    const { doctorId, slotId, consultingType, visitType, complaint } = dto;
    // validate slot
    const slot = await this.prisma.availableSlot.findUnique({ where: { id: slotId } });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.isBooked) throw new BadRequestException('Slot already booked');
    if (slot.doctorId !== doctorId) throw new BadRequestException('Slot does not belong to doctor');

    // create appointment with tokenNo auto (could be count +1)
    const tokenCount = await this.prisma.appointment.count({ where: { doctorId, scheduledOn: slot.date } });
    const appointment = await this.prisma.appointment.create({
      data: {
        doctorId,
        patientId,
        slotId,
        tokenNo: tokenCount + 1,
        consultingType,
        visitType,
        complaint,
        scheduledOn: slot.date,
        bookingSource: 'app',
      },
    });
    // mark slot booked
    await this.prisma.availableSlot.update({ where: { id: slotId }, data: { isBooked: true } });

    // TODO: trigger notification
    console.log(`Appointment confirmed for patient ${patientId} with doctor ${doctorId} on ${slot.date}`);
    return appointment;
  }

  async cancelAppointment(userId: string, appointmentId: string) {
    const patientId = await this.getPatientIdForUser(userId);
    const appt = await this.prisma.appointment.findUnique({ where: { id: appointmentId } });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.patientId !== patientId) throw new BadRequestException('Not your appointment');
    if (appt.status === 'cancelled') return appt;

    await this.prisma.appointment.update({ where: { id: appointmentId }, data: { status: 'cancelled' } });
    // free slot
    await this.prisma.availableSlot.update({ where: { id: appt.slotId }, data: { isBooked: false } });
    return { success: true };
  }

  async getPatientAppointments(userId: string) {
    const patientId = await this.getPatientIdForUser(userId);
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: { doctor: { include: { user: true } }, slot: true },
    });
  }
}
