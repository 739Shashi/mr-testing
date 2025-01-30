import mongoose, {Schema, Document , Types} from 'mongoose';
// import { Document, Types } from 'mongoose';
export interface ICaregiver extends Document {
  id: string;
  name: string;
  phoneNumber: string;
  verificationCode: string;
  userId: mongoose.Types.ObjectId;
  accessLevel: boolean;
  status: 'pending' | 'accepted'
  isVerified: boolean;
  isDeleted: boolean;
  deletedAt: Date;
  // addedBy: Types.ObjectId;
}

const CaregiverSchema = new Schema<ICaregiver>(
  {
    id:{
      type:String,
    },
    name: {
      type: String,
      required: [true, "Caregiver name is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Caregiver phone number is required"],
      // unique: true,
    },
    verificationCode: {
      type: String,
      required: [false, "Verification code is required"],
      length: 4,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accessLevel: {
      type: Boolean,
      default: false,
    },
    isVerified:{
      type: Boolean,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending',
      required: [true, "Invitation status is required"],
    },
    // addedBy:{ type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);


const caregiver = mongoose.model<ICaregiver>('Caregiver', CaregiverSchema);

export default caregiver;
