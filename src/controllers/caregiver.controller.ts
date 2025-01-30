import {NextFunction, Request, Response} from 'express';
import {authService} from "../services/auth.service";
import {sendResponse} from "../models/base-response.model";
import {generateJsonWebToken} from "../utils/generators.utils";
import {ICustomExpressRequest} from "../bin/server";
import Caregiver from "../models/caregiver.model";
import {redis} from "../config/redis.config";
import crypto from "crypto";

//invite caregiver
export const inviteCaregiver = async (
  req: ICustomExpressRequest,
  res: Response,
  _next: NextFunction
) => {
  const { name, phoneNumber, accessLevel } = req.body;
  const _id: string = req.currentUser ? req.currentUser._id : "";
  if (!name || !phoneNumber || accessLevel === undefined) {
    return sendResponse(res, 400, "Name, phone number, and access level are required.", null);
  }
  try {
    // Step 1: Convert phone number into hashed code
    const hashedNumber = crypto.createHash("sha256").update(phoneNumber).digest("hex");
    // Step 2: Generate OTP (verification code)
    const { data: verificationCode } = await authService.sendAlphaNumericOtp(phoneNumber);
    console.log("Generated OTP:", verificationCode);
    // Save to Redis: { hashedNumber: { userId, accessLevel, verificationCode } }
    const caregiverData = JSON.stringify({
      userId: _id,
      accessLevel,
      verificationCode,
    });
    // Use ioredis to save the data
    await redis.set(hashedNumber, caregiverData, "EX", 3600); // Data expires in 1 hour
    // Step 3: Save caregiver details to the database
    const caregiverRecord = {
      userId: _id,
      name,
      phoneNumber,
      accessLevel,
      hashedNumber,
      verificationCode
    };
    // Assuming you have a Caregiver model or similar to interact with your database
    const savedCaregiver = await Caregiver.create(caregiverRecord);
    // Step 4: Generate JWT token
    const token = generateJsonWebToken(_id);
    res.set("Authorization", `Bearer ${token}`);
    return res.status(201).json({
      status: true,
      message: "Caregiver invited successfully",
      data: {
        hashedNumber,
        accessLevel,
        verificationCode,
        caregiverId: savedCaregiver._id, // Return the ID of the saved caregiver
      },
    });
  } catch (error) {
    console.error("Error inviting caregiver:", error);
    return sendResponse(res, 500, "Error occurred while inviting the caregiver.", null);
  }
};


//verify caregiver
export const verifyCaregiver = async (
  req: ICustomExpressRequest,
  res: Response,
  _next: NextFunction
) => {
  const { verificationCode } = req.body;
  const currentUser = req.currentUser;
  if (!currentUser || !currentUser._id) {
    return sendResponse(res, 401, "Unauthorized access.", null);
  }
  if (!verificationCode) {
    return sendResponse(res, 400, "Verification token is required.", null);
  }
  try {
    // Get phone from currentUser
    const phoneNumber = currentUser.phoneNumber; // Adjust this to the property storing the phone number in `currentUser`
    if (!phoneNumber) {
      return sendResponse(res, 400, "Phone number is missing from the current user.", null);
    }
    // Hash the phone number to locate it in Redis
    const hashedNumber = crypto.createHash("sha256").update(phoneNumber).digest("hex");
    // Retrieve data from Redis
    const caregiverData = await redis.get(hashedNumber);
    if (!caregiverData) {
      return sendResponse(res, 404, "No caregiver data found .", null);
    }
    // Parse the data stored in Redis
    const { userId, accessLevel, verificationCode: verificationCode } = JSON.parse(caregiverData);
    if (verificationCode !== verificationCode) {
      return sendResponse(res, 400, "Invalid verification code.", null);
    }
    // Step 1: Update caregiver verification status in the database
    // Assuming you have a model for caregivers (e.g., Caregiver model)
    const caregiver = await Caregiver.findOne({ userId }); // Find the caregiver by userId
    if (!caregiver) {
      return sendResponse(res, 404, "Caregiver not found in the database.", null);
    }
    // Step 2: Update caregiver status to 'verified'
    caregiver.isVerified = true;
    caregiver.accessLevel = accessLevel;
    caregiver.status = 'accepted';
    await caregiver.save();
    await redis.del(hashedNumber);
    return res.status(200).json({
      status: true,
      message: "Caregiver verification successful and saved to database.",
      data: {
        userId,
        accessLevel,
      },
    });
  } catch (error) {
    console.error("Error verifying caregiver:", error);
    return sendResponse(res, 500, "An error occurred while verifying the caregiver.", null);
  }
};



//updating caregiver access permission
export const updateCaregiverPermission=async(
  req: ICustomExpressRequest,
  res: Response,
)=>{
  let userId;
  if (req.currentUser)
    userId = req.currentUser._id;
  const caregiverId=req.params.id;
  if (!caregiverId) {
    return sendResponse(res, 400, "CAREGIVER is missing", null);
  }
  const { name, phoneNumber, verificationCode, accessLevel, status } = req.body;
  console.log("Before updateCaregiverPermission:", {
    userId,
    caregiverId,
    update: {
      name,
      phoneNumber,
      verificationCode,
      accessLevel,
      status
    }
  });
  const updatedCaregiverPermission = await Caregiver.findOneAndUpdate(
    { userId: userId ,caregiverId}, // Filter by user ID and platform name
    {
      $set: {
        ...(name && { name }),
        ...(phoneNumber && { phoneNumber }),
        ...(verificationCode && { verificationCode }),
        ...(accessLevel && { accessLevel }),
        ...(status && { status }),
      },
    },
    { new: true }
  );
  console.log("After updateCaregiverPermission:", updatedCaregiverPermission);
  if(updatedCaregiverPermission)
    return sendResponse(res,200,"Permission updated successfully", updateCaregiverPermission);
  return sendResponse(res, 400, "Updating permission of caregiver failed",null);
};


//soft delete caregiver
export const softDeleteCaregiver = async (
  req: ICustomExpressRequest,
  res: Response,
) => {
  let userId;
  if (req.currentUser){
    userId = req.currentUser._id;
  }
  const caregiverId=req.params.id;

  if (!caregiverId){
    return sendResponse(res, 400, "caregiver Id missing ", null);
  }
  const deleteCaregiver = await Caregiver.findOneAndUpdate(
    { userId: userId, _id: caregiverId }, // Using _id for filtering
    { $set: { isDeleted: true, deletedAt: new Date() } },
    { new: true }
  );
  if (deleteCaregiver) {
    return sendResponse(res, 200, "caregiver deleted successfully", deleteCaregiver);
  }
  return sendResponse(res, 400, "caregiver deletion failed", null);
};

