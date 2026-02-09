import { Controller, Get, Post, Body, Res, Req, UseGuards, Render, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private jwtService: JwtService) {}

  @Get('signup')
  @Render('auth/signup')
  signupForm() {
    return {};
  }

  @Post('signup')
  async signup(@Body() dto: SignupDto, @Res() res: Response) {
    const user = await this.authService.signup(dto);
    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    res.cookie('jid', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.redirect('/dashboard');
  }

  @Get('login')
  @Render('auth/login')
  loginForm() {
    return {};
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Res() res: Response) {
    const identifier = dto.email ?? dto.phone;
    if (!identifier) return res.status(400).render('auth/login', { error: 'Provide email or phone' });
    const user = await this.authService.validateUserByEmailOrPhone(identifier, dto.password);
    if (!user) return res.status(401).render('auth/login', { error: 'Invalid credentials' });
    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    res.cookie('jid', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.redirect('/dashboard');
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // initiates Google OAuth2 login flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: Request, @Res() res: Response) {
    // req.user is populated by the GoogleStrategy
    const user: any = (req as any).user as any;
    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    res.cookie('jid', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.redirect('/dashboard');
  }

  @Get('logout')
  logout(@Res() res: Response) {
    res.clearCookie('jid');
    return res.redirect('/auth/login');
  }

  // ─── JSON API ROUTES (for Postman / mobile) ───

  @Post('api/signup')
  async apiSignup(@Body() dto: SignupDto, @Res() res: Response) {
    const user = await this.authService.signup(dto);
    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    res.cookie('jid', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ accessToken: token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
  }

  @Post('api/login')
  async apiLogin(@Body() dto: LoginDto, @Res() res: Response) {
    const identifier = dto.email ?? dto.phone;
    if (!identifier) return res.status(400).json({ message: 'Provide email or phone' });
    const user = await this.authService.validateUserByEmailOrPhone(identifier, dto.password);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    res.cookie('jid', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    return res.json({ accessToken: token, user: { id: user.id, fullName: user.fullName, email: user.email, role: user.role } });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async me(@Req() req: Request) {
    return (req as any).user;
  }
}
