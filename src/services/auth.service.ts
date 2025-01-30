import {generateHashedOtpTokens, generateOTP, genrateAlphaNumeric} from "../utils/generators.utils";
import {sendOtpSMS} from "./messaging/twilio.service";
import {v4 as uuidv4} from "uuid";
import {redis} from "../config/redis.config";
import {serviceResponseObj} from "../models/base-response.model";
import User from "../models/user.model";
import { formatPhoneNumber } from "../utils/common-utils";

//sendOTP service
const sendOtp = async (phoneNumber: string | null) => {
  let otpPhone;
  if (phoneNumber) {
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    otpPhone = generateOTP();
    // await sendOtpSMS(formattedPhoneNumber, otpPhone);
  }
  const {otpPhoneToken} = await generateHashedOtpTokens(
    otpPhone
  );
  const sessionToken = uuidv4();
  console.log("myphonetoken",otpPhoneToken);
  // Store OTP tokens in Redis with a short expiration
  await redis.del(sessionToken);
  await redis.set(sessionToken, JSON.stringify({
    phoneNumber: phoneNumber || '',
    otpPhoneToken: otpPhoneToken,
  }));
  await redis.expire(sessionToken, 600);
  console.log("this is the set of session token",sessionToken);
  return serviceResponseObj("Otp sent successfully", sessionToken);
}

//send verificationCode
const sendAlphaNumericOtp = async (
  phoneNumber: string | null,
) => {
  let otpPhone ="123456";

  // Format and generate OTP if the phone number is provided
  if (phoneNumber) {
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    // otpPhone = genrateAlphaNumeric();
    // await sendOtpSMS(formattedPhoneNumber, otpPhone);
  }

  // Generate hashed OTP tokens
  const { otpPhoneToken } = await generateHashedOtpTokens(otpPhone);
  const sessionToken = uuidv4();

  console.log("Generated OTP Token:", otpPhoneToken);

  // Store OTP tokens along with userId and accessLevel in Redis with expiration
  await redis.del(sessionToken);
  await redis.set(
    sessionToken,
    JSON.stringify({
      phoneNumber: phoneNumber || "",
      otpPhoneToken,
    })
  );
  await redis.expire(sessionToken, 43200);

  console.log("Session Token Created:", sessionToken);

  // Return the response with the session token
  return serviceResponseObj("OTP sent successfully", sessionToken);
};

//Signup service
const signup = async ( fullName: string,  verificationCode:string , phoneNumber:string) => {
  const user = new User({
    fullName,
    verificationCode,
    phoneNumber
  });
  await user.save();
  return serviceResponseObj("User created  successfully", user);
}

export const authService = {
  sendOtp,
  signup,
  sendAlphaNumericOtp,

};

