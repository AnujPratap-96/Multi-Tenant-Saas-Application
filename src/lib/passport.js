import passport from "passport";
import { googleStrategy } from "../modules/auth/utils/google.strategy.js";

passport.use(googleStrategy);

export default passport;
