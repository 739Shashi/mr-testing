import express from 'express';
import {
  login,
  requestOTP,
  signup,
  verifyOTP,
} from '../controllers/auth.controller';


// Define the routes for authentication endpoints

const authRouter = express.Router();

authRouter.post('/request-otp', requestOTP);
authRouter.post('/verify-otp', verifyOTP);
authRouter.post('/login', login);
authRouter.post('/sign-up', signup);


export default authRouter;
