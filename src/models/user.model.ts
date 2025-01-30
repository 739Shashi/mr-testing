import bcrypt from 'bcryptjs';
import mongoose, {Schema, Model, Document, HydratedDocument} from 'mongoose';
import validator from 'validator';
import {apiRoles} from "../config/roles.config";
import {bool} from "twilio/lib/base/serialize";

/**
 * Define the User model...
 */
export interface IUser {
  _id: string;
  fullName: string;
  // email: string;
  phoneNumber?: string;
  verificationCode:string;
  // password: string;
  // isVerifiedEmail: boolean;
  isVerifiedPhone: boolean;
  isVerified: boolean;
  role: string;
  active: boolean;
  employeeId: string;
  pictureUrl?: string;
  clientId: string;
  vendorId: string;
  deleted: boolean;
  accessLevel:boolean;
  save?(): Promise<any>;
  lastLoginDate: Date;
  notification: {
    fcmPermission: string;
    firebaseMessageToken: string;
  };
}

/**
 * Exporting methods for User
 */
export interface IUserMethods {
  toJSON(): Document<this>;

  comparePassword(password: string): Promise<boolean>;
}

/**
 * Create a new Model type that knows about Methods and stati and IUser...
 */
export interface IUserModel extends Model<IUser, {}, IUserMethods> {
  checkExistingField: (
    field: string,
    value: string
  ) => Promise<HydratedDocument<IUser, IUserMethods>>;
}

const UserSchema = new Schema<IUser, IUserModel, IUserMethods>(
  {
    fullName: {
      type: String,
    },
    // email: {
    //   type: String,
    //   required: [true, "Email can't be blank"],
    //   unique: true,
    //   lowercase: true,
    //   validate: [validator.isEmail, 'Please provide an email address'],
    // },
    phoneNumber: {type: String, required:true, minlength: 10},
    accessLevel:{type: Boolean },// Changed to String
    // password: {type: String, required: true, minlength: 5},
    verificationCode:{type:String, required:false},
    // isVerifiedEmail: {
    //   type: Boolean,
    //   default: false,
    // },
    isVerifiedPhone: {
      type: Boolean,
      default: false,
    },
    lastLoginDate: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: apiRoles,
      default: 'user',
    },
    active: {
      type: Boolean,
      default: true,
    },
    pictureUrl: {
      type: String,
      trim: true,
      validate: {
        validator: (value: string) =>
          validator.isURL(value, {
            protocols: ['http', 'https', 'ftp'],
            require_tld: true,
            require_protocol: true,
          }),
        message: 'Must be a Valid URL',
      },
    },
  },
  {timestamps: true}
);

UserSchema.pre<HydratedDocument<IUser, IUserMethods>>(
  'save',
  async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    // this.password = await bcrypt.hash(this.password, salt);
    next();
  }
);

UserSchema.methods.toJSON = function () {
  const userObj: any = this.toObject();
  userObj.id = userObj._id;
  delete userObj._id;
  delete userObj.password;
  delete userObj.__v;
  return userObj;
};

// UserSchema.methods.comparePassword = async function (password: string) {
//   // return bcrypt.compare(password, this.password);
// };

UserSchema.statics.checkExistingField = async function (
  field: string,
  value: string
) {
  return this.findOne({[field]: value});
};

const User = mongoose.model<IUser, IUserModel>('User', UserSchema, 'users');

export default User;

