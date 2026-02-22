import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientID || !clientSecret) {
      // Provide dummy values so passport doesn't crash. The route guard will fail gracefully.
      super({
        clientID: 'not-configured',
        clientSecret: 'not-configured',
        callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback',
        scope: ['profile', 'email'],
        passReqToCallback: true,
      });
      console.warn('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
      return;
    }
    super({
      clientID,
      clientSecret,
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback',
      scope: ['profile', 'email'],
      passReqToCallback: true,
    });
  }

  // req is passed because passReqToCallback=true
  async validate(req: any, accessToken: string, refreshToken: string, profile: any, done: Function) {
    try {
      // allow role to be sent via `state` parameter, default to patient
      const state: string | undefined = req.query.state;
      const role = state === 'doctor' ? 'doctor' : 'patient';
      const user = await this.authService.findOrCreateFromGoogle(profile, role);
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
