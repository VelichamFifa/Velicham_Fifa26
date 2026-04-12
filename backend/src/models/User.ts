import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  User_ID: string;
  Email: string;
  First_Name: string;
  Last_Name: string;
  password?: string;
  googleId?: string;
  profileImage?: string;
  Status: 'Active' | 'Inactive';
  Creation_Time: Date;
  WhatsApp_Number?: string;
  City?: string;
  State?: string;
  Country: string;
  Community_ID?: string;
  role?: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    User_ID: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    Email: {
      type: Schema.Types.String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    First_Name: {
      type: Schema.Types.String,
      required: true
    },
    Last_Name: {
      type: Schema.Types.String,
      required: true
    },
    password: {
      type: Schema.Types.String
    },
    googleId: {
      type: Schema.Types.String,
      index: true
    },
    profileImage: {
      type: Schema.Types.String
    },
    Status: {
      type: Schema.Types.String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    Creation_Time: {
      type: Schema.Types.Date,
      default: Date.now
    },
    WhatsApp_Number: {
      type: Schema.Types.String
    },
    City: {
      type: Schema.Types.String
    },
    State: {
      type: Schema.Types.String
    },
    Country: {
      type: Schema.Types.String,
      default: 'India'
    },
    Community_ID: {
      type: String,
      index: true
    },
    role: {
      type: Schema.Types.String,
      enum: ['user', 'admin'],
      default: 'user'
    }
  },
  {
    collection: 'users',
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
