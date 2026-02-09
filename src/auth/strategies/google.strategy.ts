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
      });
      console.warn('Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
      return;
    }
    super({
      clientID,
      clientSecret,
      callbackURL: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback',
      scope: ['profile', 'email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: Function) {
    try {
      const user = await this.authService.findOrCreateFromGoogle(profile);
      done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
}
