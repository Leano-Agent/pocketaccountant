import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as AppleStrategy } from 'passport-apple';
import jwt from 'jsonwebtoken';
import { AppDataSource } from '../data-source';
import { User } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_fallback';

// Serialize/Deserialize for sessions
passport.serializeUser((user: any, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
    try {
        const repo = AppDataSource.getRepository(User);
        const user = await repo.findOne({ where: { id } });
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const repo = AppDataSource.getRepository(User);
            const email = profile.emails?.[0]?.value;

            if (!email) {
                return done(new Error('No email from Google account'));
            }

            // Find or create user
            let user = await repo.findOne({ where: { email } });
            if (!user) {
                user = repo.create({
                    email,
                    name: profile.displayName,
                    password_hash: `oauth_google_${profile.id}`,
                    default_currency: 'ZAR',
                    preferred_currencies: 'ZAR,USD,EUR',
                    email_verified: true,
                });
                user = await repo.save(user);
            }

            return done(null, user);
        } catch (err) {
            return done(err as Error);
        }
    }));
}

// Apple OAuth Strategy
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    passport.use(new AppleStrategy({
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKeyString: process.env.APPLE_PRIVATE_KEY,
        callbackURL: process.env.APPLE_CALLBACK_URL || 'http://localhost:5000/api/auth/apple/callback',
        scope: ['name', 'email'],
    }, async (accessToken, refreshToken, idToken, profile, done) => {
        try {
            const repo = AppDataSource.getRepository(User);
            const email = profile?.email || (idToken as any)?.email;

            if (!email) {
                return done(new Error('No email from Apple account'));
            }

            let user = await repo.findOne({ where: { email } });
            if (!user) {
                user = repo.create({
                    email,
                    name: profile?.name?.firstName
                        ? `${profile.name.firstName} ${profile.name.lastName || ''}`
                        : email.split('@')[0],
                    password_hash: `oauth_apple_${profile?.id || email}`,
                    default_currency: 'ZAR',
                    preferred_currencies: 'ZAR,USD,EUR',
                    email_verified: true,
                });
                user = await repo.save(user);
            }

            return done(null, user);
        } catch (err) {
            return done(err as Error);
        }
    }));
}

export class OAuthController {
    // Generate JWT for OAuth-authenticated user
    generateToken(user: User): { token: string; user: Partial<User> } {
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '30d' }
        );

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                default_currency: user.default_currency,
                preferred_currencies: user.preferred_currencies,
            },
        };
    }

    // Google Auth
    googleAuth(req: Request, res: Response, next: NextFunction) {
        const authenticator = passport.authenticate('google', {
            scope: ['profile', 'email'],
            session: false,
        });
        authenticator(req, res, next);
    }

    googleCallback(req: Request, res: Response, next: NextFunction) {
        const authenticator = passport.authenticate('google', {
            session: false,
            failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
        }, (err: Error, user: User) => {
            if (err || !user) {
                return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`);
            }
            const result = this.generateToken(user);
            return res.redirect(
                `${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-callback?token=${result.token}`
            );
        });
        authenticator(req, res, next);
    }

    // Apple Auth
    appleAuth(req: Request, res: Response, next: NextFunction) {
        const authenticator = passport.authenticate('apple', { session: false });
        authenticator(req, res, next);
    }

    appleCallback(req: Request, res: Response, next: NextFunction) {
        const authenticator = passport.authenticate('apple', {
            session: false,
            failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`,
        }, (err: Error, user: User) => {
            if (err || !user) {
                return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`);
            }
            const result = this.generateToken(user);
            return res.redirect(
                `${process.env.CLIENT_URL || 'http://localhost:5173'}/oauth-callback?token=${result.token}`
            );
        });
        authenticator(req, res, next);
    }

    // Exchange OAuth token for user info (called by frontend)
    me(req: Request, res: Response) {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
            res.json({
                data: {
                    id: decoded.userId,
                    email: decoded.email,
                    token,
                },
            });
        } catch {
            res.status(403).json({ error: 'Invalid token' });
        }
    }
}

export default passport;
