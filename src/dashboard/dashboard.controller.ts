import { Controller, Get, Req, Render, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller()
export class DashboardController {
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @Render('dashboard')
  async dashboard(@Req() req: Request) {
    const user = (req as any).user;
    return { user };
  }
}
