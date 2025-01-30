import crypto from 'crypto';
import {Response} from 'express';
import bcryptjs from "bcryptjs";
import jwt from 'jsonwebtoken';
import {ICustomExpressRequest} from "../bin/server";
import {IUser} from "../models/user.model";



/**
 * Generate a JSON Web Token with a single payload key.
 * @param payloadValue The value to store in the payload.
 * @param expiresIn Token expiration time (default: 10 days).
 * @returns A signed JWT as a string.
 */
const generateJsonWebToken = (payloadValue: IUser | string, expiresIn = process.env.JWT_EXPIRATION_LONG): string => {
  const jwtKey = process.env.JWT_KEY;

  if (!jwtKey) {
    throw new Error('Missing JWT key in environment variables');
  }

  // Payload is a single key-value pair
  const payload = {payloadKey: payloadValue};
  return jwt.sign(payload, jwtKey, {expiresIn});
};



/**
 * Decode a JSON Web Token and extract the single payload value.
 * @param token The JWT to decode.
 * @returns The value stored in the payloadKey.
 */
const decodeJsonWebToken = (token: string): string | null => {
  try {
    const jwtKey = process.env.JWT_KEY;

    if (!jwtKey) {
      throw new Error('Missing JWT key in environment variables');
    }

    // Decode the token
    const decoded = jwt.verify(token, jwtKey) as { payloadKey: string };

    // Return the single payload value
    return decoded.payloadKey;
  } catch (error) {
    console.error('JWT decoding error:', error);
    return null;
  }
};

/**
 * Generate a cookie with a token
 * @param cookieName
 * @param token
 * @param req
 * @param res
 */
const generateCookie = (
  cookieName: string,
  token: string,
  req: ICustomExpressRequest,
  res: Response
) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: req.secure || req.headers['x-forwarded-proto'] === 'https',
  };

  res.cookie(cookieName, token, cookieOptions);
};

/**
 * Generate a random OTP
 * @returns
 */
const generateOTP = (): string => {
  const chars = '0123456789';
  let otp = '';

  while (otp.length < 6) {
    const randomBytes = crypto.randomBytes(6);
    const randomIndex = randomBytes.readUInt32BE(0) % chars.length;
    otp += chars.charAt(randomIndex);
  }

  return otp;
};

const generateVerificationCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Generates a 4-digit random number
};


const genrateAlphaNumeric = (): string =>{
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let otp = '';

  while (otp.length < 6) {
    const randomBytes = crypto.randomBytes(1); // Generate random byte
    const randomIndex = randomBytes[0] % chars.length; // Map byte to chars index
    otp += chars.charAt(randomIndex);
    console.log("verification Code " + otp);// Append character to OTP
  }

  return otp
}


const generateHashedOtpTokens = async (
  otpPhone?: string
): Promise<{otpPhoneToken?: string }> => {
  if (!otpPhone) {
    throw new Error('otpPhone cannot be undefined');
  }

  const otpPhoneToken = otpPhone
    ? await bcryptjs.hash(otpPhone, 12)
    : undefined;

  return {otpPhoneToken};
};

export {generateOTP, generateCookie, generateJsonWebToken, generateHashedOtpTokens, decodeJsonWebToken, generateVerificationCode, genrateAlphaNumeric};

