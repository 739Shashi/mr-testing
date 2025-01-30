import dotenv from 'dotenv';
import passport from 'passport';
import passportLocal, {IStrategyOptionsWithRequest} from 'passport-local';
import GoogleTokenStrategy from 'passport-google-id-token';
import User, {IUser} from '../models/user.model';
import Logger from '../utils/logger';
import {ICustomExpressRequest} from "../bin/server";

dotenv.config();


const LocalStrategy = passportLocal.Strategy;

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((id, done) => {
  User.findOne({_id: id}, (_: NativeError, user: IUser) => {
    done(null, user);
  });
});

// Define fields for local login
const authFields: IStrategyOptionsWithRequest = {
  usernameField: 'identifier',
  passwordField: 'password',
  passReqToCallback: true,
};

/**
 * Local Login Strategy for email or mobile number login
 */
passport.use(
  'login',
  new LocalStrategy(
    authFields,
    async (_: ICustomExpressRequest, identifier, password, cb) => {
      try {
        // Determine if identifier is an email or mobile number
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
        console.log("The value is", isEmail, identifier);
        const searchCriteria = isEmail
          ? {email: identifier.toLowerCase()}
          : {phoneNumber: identifier}; // Adjust 'phoneNumber' based on your User schema field

        const user = await User.findOne(searchCriteria).exec();

        if (!user) {
          return cb(null, false, {message: 'User not found.'});
        }

        // if (isEmail) {
        //   const checkPassword = await user.comparePassword(password);
        //
        //   if (!checkPassword) {
        //     return cb(null, false, {message: 'Incorrect credentials.'});
        //   }
        // }

        user.lastLoginDate = new Date();
        await user.save();

        return cb(null, user, {message: 'Logged In Successfully'});
      } catch (err) {
        if (err instanceof Error) {
          Logger.debug("Login error:", err);
          return cb(null, false, {message: err.message});
        }
      }
    }
  )
);


/**
 * Google ID Token strategy (for backend validation)
 */
passport.use(
  new GoogleTokenStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
    },
    async (parsedToken: any, _: string, done: (err: any, user: any) => void) => {
      try {
        const {payload} = parsedToken;
        if (!payload) {
          console.error('Invalid Google token: No payload found.');
          return done(new Error('No payload found in token'), null);
        }

        // Extract user details from the Google token payload
        const email = payload.email;

        // Check if a user already exists in the database by email
        const user = await User.findOne({email}).exec();

        if (!user) {
          console.error('User with this email does not exist.');
          return done(new Error('User not found'), null); // If no user is found, return an error
        }

        // If the user exists, authenticate them (you can add additional checks if needed)
        return done(null, user); // Proceed with the existing user

      } catch (error) {
        if (error instanceof Error) {
          console.error('Error validating Google token:', error.message);
        } else {
          console.error('Unexpected error validating Google token:', error);
        }
        return done(error, null); // Return any other error
      }
    }
  )
);


export default passport;
