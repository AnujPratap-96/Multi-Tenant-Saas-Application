import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { env } from "../../../config/env.js";
import { findUserByEmail, createUser, updateUser } from "../../users/user.repository.js";

export const googleStrategy = new GoogleStrategy(
  {
    clientID: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    callbackURL: env.GOOGLE_CALLBACK_URL,
  },
  async (_accessToken, _refreshToken, profile, done) => {
    try {
      const email = profile.emails[0].value;

      let user = await findUserByEmail(email);

      if (user && (user.deletedAt || !user.isActive)) {
        return done(null, false);
      }

      if (!user) {
        user = await createUser({
          email,
          password: null,          // 🔑 Google users don’t need password
          emailVerified: true,
        });
      } else if (!user.emailVerified) {
        // Google is a verified identity provider
        user = await updateUser(user.id, { emailVerified: true });
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
);
