import { Controller, Get, Post, Body, Res, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyDto } from './dto/verify.dto';
import { OnboardDto } from './dto/onboard.dto';
import type { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private jwtService: JwtService) {}

  // ---------- standard REST endpoints ----------

  @Post('signup')
  async signup(@Body() dto: SignupDto, @Res() res: Response) {
    const user = await this.authService.signup(dto);
    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    res.cookie('jid', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ accessToken: token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const identifier = dto.email ?? dto.phone;
    if (!identifier) return res.status(400).json({ message: 'Provide email or phone' });
    const user = await this.authService.validateUserByEmailOrPhone(identifier, dto.password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    res.cookie('jid', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ accessToken: token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
  }

  @Post('signout')
  async signout(@Res() res: Response) {
    // clear cookie, client should also drop token
    res.clearCookie('jid');
    return res.json({ success: true });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: Request) {
    return (req as any).user;
  }

  // request a verification code for email or phone (logged to console)
  @Post('request-verification')
  @UseGuards(AuthGuard('jwt'))
  async requestVerification(@Req() req: Request, @Body('type') type: 'email' | 'phone') {
    const user = (req as any).user;
    await this.authService.createVerificationToken(user.id, type);
    return { success: true, message: `token sent (console output)` };
  }

  @Post('verify')
  async verify(@Body() dto: VerifyDto) {
    const ok = await this.authService.verifyToken(dto.token, dto.type);
    return { success: ok };
  }

  @Post('onboard')
  @UseGuards(AuthGuard('jwt'))
  async onboard(@Req() req: Request, @Body() dto: OnboardDto) {
    const user = (req as any).user;
    await this.authService.completeOnboarding(user.id, dto);
    return { success: true };
  }
  // ---------- google oauth (social login) ----------
  // `role` may be provided as query state (patient or doctor).  
  // e.g. /auth/google?state=doctor

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // passport will redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    const user: any = (req as any).user;
    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    res.cookie('jid', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ accessToken: token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
  }}
