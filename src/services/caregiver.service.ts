import {serviceResponseObj} from "../models/base-response.model";
import Caregiver from "../models/caregiver.model";
import {redis} from "../config/redis.config";

//invite Caregiver
const inviteCaregiver = async (
  name: string,
  phoneNumber: string,
  accessLevel: boolean
): Promise<{ data: any }> => {
  const caregiver = new Caregiver({
    name,
    phoneNumber,
    accessLevel,
  });

  await caregiver.save();
  return serviceResponseObj("Caregiver created successfully", caregiver);
};


// Service function to retrieve caregiver by ID
// const getCaregiverById = async (id: string) => {
//   const caregiver = await Caregiver.findById(id);
//   if (!caregiver) {
//     throw new Error("Caregiver not found");
//   }
//   return caregiver;
// };

export const authCaregiver = {
  inviteCaregiver,
  // getCaregiverById,  // Add the new method here
};






