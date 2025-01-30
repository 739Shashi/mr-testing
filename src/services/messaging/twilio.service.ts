import {Twilio} from 'twilio';
import Logger from '../../utils/logger';
import {CustomError} from "../../utils/errors";

/**
 * Send an OTP via SMS using Twilio
 * @param phone
 * @param otp
 */

const sendOtpSMS = async (phone: string, otp: string): Promise<void> => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID; // Twilio Account SID
    const authToken = process.env.TWILIO_AUTH_TOKEN; // Twilio Auth Token
    const client = new Twilio(accountSid, authToken);
    const message = await client.messages.create({
      body: `Your OTP is: ${otp} /n www.mr.com`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    console.log(`OTP sent to ${phone}: ${message.sid}`);
  } catch (error) {
    Logger.error(error);
    if (error instanceof CustomError) {
      throw new CustomError(error.statusCode, error.message);
    }
    throw error;
  }
};

export {sendOtpSMS};
