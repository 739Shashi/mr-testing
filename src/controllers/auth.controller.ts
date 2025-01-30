import {NextFunction, Response} from 'express';
import Logger from '../utils/logger';
import passport from '../config/passport.config';
import {sendResponse} from "../models/base-response.model";
import {authService} from '../services/auth.service';
import {generateJsonWebToken} from "../utils/generators.utils";
import {ICustomExpressRequest} from "../bin/server";
import {CustomError} from "../utils/errors";


const requestOTP = async (
  req: ICustomExpressRequest,
  res: Response,
): Promise<void> => {
  const {phoneNumber} = req.body;
  console.log(phoneNumber);
  if (!phoneNumber) {
    sendResponse(res, 400, 'Please provide phone number', null);
  }
   const {data} = await authService.sendOtp(phoneNumber);
  const jwtSessionToken = generateJsonWebToken(data, process.env.JWT_EXPIRATION_SHORT);
  res.set('Authorization', `Bearer ${jwtSessionToken}`);
  let responseMessage = 'OTP sent to ';
  if (phoneNumber) {
    responseMessage += 'your phone number';
  }
  sendResponse(res, 200, responseMessage, null);
};


const verifyOTP = async (
  _req: ICustomExpressRequest,
  res: Response,
  _next: NextFunction
) => {
  try {
    // Generate a verification token
    const user  = _req.currentUser || null;
    console.log("user", user);
    const verificationToken = user? generateJsonWebToken(user._id.toString(), process.env.JWT_EXPIRATION_LONG): generateJsonWebToken( "RandomValue", process.env.JWT_EXPIRATION_SHORT);
    res.set('Authorization', `Bearer ${verificationToken}`);
    sendResponse(res, 200, 'OTP verified successfully', user);
  } catch (error) {
    console.log("This is the point ", error);
    Logger.error(error);
    if (error instanceof CustomError) {
      throw new CustomError(error.statusCode, error.message);
    }
  }
};

const signup = async (
  req: ICustomExpressRequest,
  res: Response,
  _next: NextFunction
) => {
  console.log("data received");
  const {fullName,verificationCode,phoneNumber} = req.body;
  let message = null;
  if (!fullName) message = "Full name is required";
  if (message)
    return sendResponse(res, 400, message, null);
  const serviceRes = await authService.signup(fullName,  verificationCode, phoneNumber);
  const token = generateJsonWebToken(serviceRes.data._id.toString());
  res.set('Authorization', `Bearer ${token}`);
  res.status(201).json({
    status: true,
    message: 'User created successfully',
    data: serviceRes.data,
  });

}


/**
 * Login Local strategy
 * @param req
 * @param res
 * @param next
 */


const login = async (
  req: ICustomExpressRequest,
  res: Response,
  next: NextFunction
) => {
  const authStrategy = req.body.googleIdToken ? 'google' : 'login';
  passport.authenticate(authStrategy, {session: false}, (err: any, user: { _id: any; }) => {
    if (err || !user) {
      // console.log(user.password);
      return sendResponse(res, 401, `Login Failed due to ${err}`, null);
    }
    const token = generateJsonWebToken(user._id.toString());
    res.set('Authorization', `Bearer ${token}`);
    return sendResponse(res, 200, 'Logged in successfully', user);
  })(req, res, next);
}

export {
  requestOTP,
  verifyOTP,
  signup,
  login,
};


