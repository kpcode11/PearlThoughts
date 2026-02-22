import { Controller, Get, Post, Body, Param, UseGuards, Req, BadRequestException, NotFoundException } from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  // doctor listing
  @Get('/doctors')
  async listDoctors(@Req() req: Request) {
    const { specialization } = req.query as any;
    return this.service.listDoctors(specialization);
  }

  // patient creates appointment
  @UseGuards(JwtAuthGuard)
  @Post()
  async book(@Req() req: Request, @Body() dto: any) {
    const user = (req as any).user;
    if (user.role !== 'patient') throw new BadRequestException('Only patients can book');
    return this.service.bookAppointment(user.id, dto);
  }

  // cancel appointment by patient
  @UseGuards(JwtAuthGuard)
  @Post(':id/cancel')
  async cancel(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    return this.service.cancelAppointment(user.id, id);
  }

  // list patient's appointments
  @UseGuards(JwtAuthGuard)
  @Get()
  async myAppointments(@Req() req: Request) {
    const user = (req as any).user;
    return this.service.getPatientAppointments(user.id);
  }
}
