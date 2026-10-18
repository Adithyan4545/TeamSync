import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User';

export const configurePassport = (): void => {
  const clientID = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  if (!clientID || !clientSecret) {
    console.warn('⚠️ Google OAuth credentials missing in environment variables (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET). Passport Google Strategy skipped.');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        passReqToCallback: false,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails && profile.emails[0]?.value;
          const googleId = profile.id;
          const name = profile.displayName || profile.name?.givenName || 'Google User';
          const avatarUrl = profile.photos && profile.photos[0]?.value;

          if (!email) {
            return done(new Error('No email found in Google profile'), false);
          }

          // 1. Check if user with googleId exists
          let user = await User.findOne({ googleId, isDeleted: { $ne: true } });

          if (!user) {
            // 2. Check if user with same email exists
            user = await User.findOne({ email, isDeleted: { $ne: true } });

            if (user) {
              // Link googleId to existing email user
              user.googleId = googleId;
              if (!user.avatarUrl && avatarUrl) {
                user.avatarUrl = avatarUrl;
              }
              user.isVerified = true;
              await user.save();
            } else {
              // 3. Create new user with Google profile information
              user = new User({
                name,
                email,
                googleId,
                avatarUrl,
                isVerified: true,
                role: 'student',
              });
              await user.save();
            }
          } else {
            // Existing Google user - update avatar if available and verify email
            if (!user.avatarUrl && avatarUrl) {
              user.avatarUrl = avatarUrl;
            }
            if (!user.isVerified) {
              user.isVerified = true;
            }
            await user.save();
          }

          return done(null, user as any);
        } catch (err) {
          return done(err as Error, false);
        }
      }
    )
  );
};
