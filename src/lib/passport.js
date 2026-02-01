import passport from "passport";
import { googleStrategy } from "../modules/auth/google.strategy.js";

passport.use(googleStrategy);

export default passport;
