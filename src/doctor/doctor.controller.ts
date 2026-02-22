import { Controller, Get, Put, Post, Body, Req, UseGuards, Param } from '@nestjs/common';
import { DoctorService } from './doctor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfileUpdateDto } from './dto/profile-update.dto';
import { SlotDto } from './dto/slot.dto';
import type { Request } from 'express';

@Controller('doctor')
@UseGuards(JwtAuthGuard)
export class DoctorController {
  constructor(private readonly service: DoctorService) {}

  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = (req as any).user;
    return this.service.getProfile(user.id);
  }

  @Put('profile')
  async updateProfile(@Req() req: Request, @Body() dto: ProfileUpdateDto) {
    const user = (req as any).user;
    return this.service.updateProfile(user.id, dto);
  }

  @Post('slots')
  async createSlot(@Req() req: Request, @Body() dto: SlotDto) {
    const user = (req as any).user;
    return this.service.createSlot(user.id, dto);
  }

  @Get('slots')
  async listSlots(@Req() req: Request) {
    const user = (req as any).user;
    return this.service.listSlots(user.id);
  }

  @Get('appointments')
  async listAppointments(@Req() req: Request) {
    const user = (req as any).user;
    return this.service.listAppointments(user.id);
  }

  @Post('appointments/:id/cancel')
  async cancelAppointment(@Req() req: Request, @Param('id') id: string) {
    const user = (req as any).user;
    return this.service.cancelAppointment(user.id, id);
  }
}
