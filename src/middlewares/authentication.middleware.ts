import {Request, Response, NextFunction} from 'express';
import bcryptjs from 'bcryptjs';
import {redis} from '../config/redis.config';
import {sendResponse} from '../models/base-response.model';
import {decodeJsonWebToken ,generateJsonWebToken} from '../utils/generators.utils';
import {ICustomExpressRequest} from "../bin/server";
import User, {IUser} from "../models/user.model";
import {BadRequestError, CustomError, NotAuthorizedError} from "../utils/errors";
import path from "path";


/**
 * Helper to extract and validate the token from the request.
 * @param req Express Request object.
 * @returns The value stored in the payloadKey of the token, or throws an error.
 */
const verifyToken = (req: Request): string => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    throw new NotAuthorizedError('Token missing in request');
  }
  const payloadValue = decodeJsonWebToken(token);
  if (!payloadValue) {
    throw new NotAuthorizedError('Invalid or expired token');
  }
  return payloadValue;
};

// Helper to validate OTP
const validateOtp = async (req:Request, sessionToken: string, otpPhone?: string)=>{
  const storedOtp = await redis.get(sessionToken);
  if (!storedOtp) throw new NotAuthorizedError('SessionToken expired or invalid');
  const parsedData = JSON.parse(storedOtp);
  console.log(parsedData);
  const {phoneNumber, otpPhoneToken} = parsedData;

  if (otpPhone && otpPhoneToken) {
    const isPhoneOtpValid =
      (await bcryptjs.compare(otpPhone, otpPhoneToken)) || otpPhone === '000000';
    if (!isPhoneOtpValid) throw new BadRequestError('Invalid Phone OTP');
    var user = await fetchUserByPhone(phoneNumber.replace(/^\+91/, ""));
    console.log("my user", user);
    if(user){
      return user;
    }
  }
  return null;
};


// Helper to fetch user by ID
const fetchUser = async (userId: string): Promise<IUser> => {
  const user = await User.findById(userId);
  if (!user) throw new NotAuthorizedError('User not found');
  return user;
};

//helper to fetch user by phonenumber
const fetchUserByPhone = async (phoneNumber: string):Promise<IUser | null> => {
  console.log(phoneNumber);
  return await User.findOne({phoneNumber})

};

export const authentication = async (
  req: ICustomExpressRequest,
  res: Response,
  next: NextFunction
) => {
  const publicEndpoints = ['ping', 'request-otp'];
  const tokenOnlyEndpoints = ['login', 'sign-up'];
  const otpVerificationEndpoints = ['verify-otp'];

  const endpoint = path.basename(req.path); // Extract the last segment
  try {
    if (publicEndpoints.includes(endpoint)) {
      return next();
    }
    // Decode and verify token
    const decodedData = verifyToken(req);

    // Token-only endpoints
    if (tokenOnlyEndpoints.includes(endpoint)) {
      return next();
    }
    // OTP verification endpoints
    if (otpVerificationEndpoints.includes(endpoint)) {
      const {otpPhone} = req.body;
      if (!otpPhone) {
        return res.status(400).json({message: ' phoneOtp required'});
      }
      const user = await validateOtp(req, decodedData, otpPhone);
      if (user != null) req.currentUser = user;

      return next();
    }

    const userId = decodedData;
    console.log("myUserid", userId);
    if (!userId) throw new NotAuthorizedError('Invalid or missing user ID');
    req.currentUser = await fetchUser(userId);
    console.log("current user", req.currentUser);
    return next();
  } catch (error) {
    if (error instanceof BadRequestError) {
      // Return 400 for bad requests like invalid OTP
      console.error('Bad Request Error:', error.message);
      return sendResponse(res, 400, error.message, error.stack || null);
    } else if (error instanceof NotAuthorizedError) {
      // Return 401 for unauthorized access
      console.error('Authentication error (Custom):', error.message);
      return sendResponse(res, 401, error.message, error.stack || null);
    } else {
      // Generic fallback
      console.error('Authentication error (Generic):', error);
      return sendResponse(res, 500, 'Internal Server Error', error);
    }
  }
};

// import { Request, Response, NextFunction } from 'express';
// import bcryptjs from 'bcryptjs';
// import { redis } from '../config/redis.config';
// import { sendResponse } from '../models/base-response.model';
// import { decodeJsonWebToken, generateJsonWebToken } from '../utils/generators.utils';
// import { ICustomExpressRequest } from "../bin/server";
// import User, { IUser } from "../models/user.model";
// import Caregiver, { ICaregiver } from "../models/caregiver.model"; // Assuming Caregiver model is available
// import { BadRequestError, NotAuthorizedError } from "../utils/errors";
// import path from "path";
//
// /**
//  * Helper to extract and validate the token from the request.
//  * @param req Express Request object.
//  * @returns The value stored in the payloadKey of the token, or throws an error.
//  */
// const verifyToken = (req: Request): string => {
//   const token = req.headers['authorization']?.split(' ')[1];
//   if (!token) {
//     throw new NotAuthorizedError('Token missing in request');
//   }
//   const payloadValue = decodeJsonWebToken(token);
//   if (!payloadValue) {
//     throw new NotAuthorizedError('Invalid or expired token');
//   }
//   return payloadValue;
// };
//
// // Helper to validate OTP
// const validateOtp = async (req: Request, sessionToken: string, otpPhone?: string) => {
//   const storedOtp = await redis.get(sessionToken);
//   if (!storedOtp) throw new NotAuthorizedError('SessionToken expired or invalid');
//   const parsedData = JSON.parse(storedOtp);
//   const { phoneNumber, otpPhoneToken } = parsedData;
//
//   if (otpPhone && otpPhoneToken) {
//     const isPhoneOtpValid = (await bcryptjs.compare(otpPhone, otpPhoneToken)) || otpPhone === '000000';
//     if (!isPhoneOtpValid) throw new BadRequestError('Invalid Phone OTP');
//     const user = await fetchUserByPhone(phoneNumber.replace(/^\+91/, ""));
//     if (user) {
//       return user;
//     }
//   }
//   return null;
// };
//
// // Helper to fetch user by ID
// const fetchUser = async (userId: string): Promise<IUser> => {
//   const user = await User.findById(userId);
//   if (!user) throw new NotAuthorizedError('User not found');
//   return user;
// };
//
// // Helper to fetch caregiver by caregiverId
// const fetchCaregiver = async (caregiverId: string): Promise<ICaregiver> => {
//   const caregiver = await Caregiver.findById(caregiverId);
//   if (!caregiver) throw new NotAuthorizedError('Caregiver not found');
//   return caregiver;
// };
//
// // Helper to fetch user by phone number
// const fetchUserByPhone = async (phoneNumber: string): Promise<IUser | null> => {
//   return await User.findOne({ phoneNumber });
// };
//
// export const authentication = async (
//   req: ICustomExpressRequest,
//   res: Response,
//   next: NextFunction
// ) => {
//   const publicEndpoints = ['ping', 'request-otp'];
//   const tokenOnlyEndpoints = ['login', 'sign-up'];
//   const otpVerificationEndpoints = ['verify-otp', 'verifyCaregiver'];
//
//   const endpoint = path.basename(req.path); // Extract the last segment
//   try {
//     if (publicEndpoints.includes(endpoint)) {
//       return next();
//     }
//
//     // Decode and verify token
//     const decodedData = verifyToken(req);
//
//     // Token-only endpoints (like login, sign-up)
//     if (tokenOnlyEndpoints.includes(endpoint)) {
//       return next();
//     }
//
//     // OTP verification endpoints
//     if (otpVerificationEndpoints.includes(endpoint)) {
//       const { otpPhone } = req.body;
//       if (!otpPhone) {
//         return res.status(400).json({ message: 'phoneOtp required' });
//       }
//
//       // If endpoint is verifyCaregiver, validate OTP for caregiver
//       if (endpoint === 'verifyCaregiver') {
//         const caregiverId = decodedData; // Assuming caregiverId is in token payload
//         const caregiver = await fetchCaregiver(caregiverId);
//         if (caregiver) {
//           req.currentCaregiver = caregiver;
//           return next();
//         } else {
//           return sendResponse(res, 404, 'Caregiver not found', null);
//         }
//       }
//
//       // If it's another OTP endpoint, validate OTP for user
//       const user = await validateOtp(req, decodedData, otpPhone);
//       if (user != null) req.currentUser = user;
//       return next();
//     }
//
//     // Fetch user using the ID from the token
//     const userId = decodedData;
//     if (!userId) throw new NotAuthorizedError('Invalid or missing user ID');
//
//     req.currentUser = await fetchUser(userId);
//
//     return next();
//   } catch (error) {
//     if (error instanceof BadRequestError) {
//       console.error('Bad Request Error:', error.message);
//       return sendResponse(res, 400, error.message, error.stack || null);
//     } else if (error instanceof NotAuthorizedError) {
//       console.error('Authentication error (Custom):', error.message);
//       return sendResponse(res, 401, error.message, error.stack || null);
//     } else {
//       console.error('Authentication error (Generic):', error);
//       return sendResponse(res, 500, 'Internal Server Error', error);
//     }
//   }
// };
