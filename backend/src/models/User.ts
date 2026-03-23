import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
  status: 'active' | 'inactive' | 'suspended';
  creationTime: Date;
  phoneNumber?: string;
  city: string;
  state: string;
  country: string;
  comment?: string;
  communityId1?: string;
  communityId2?: string;
  isActive: boolean;
  googleId?: string;
  instagramId?: string;
  profileImage?: string;
  role: 'user' | 'admin';
  requestedCommunity?: {
    name: string;
    shortName: string;
    description: string;
    isOnline: boolean;
    city: string;
    state: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    userId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    creationTime: {
      type: Date,
      default: Date.now,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
    },
    comment: {
      type: String,
    },
    communityId1: {
      type: String,
      ref: 'Community',
    },
    communityId2: {
      type: String,
      ref: 'Community',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    instagramId: {
      type: String,
      sparse: true,
    },
    profileImage: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    requestedCommunity: {
      type: new Schema({
        name: { type: String, trim: true },
        shortName: { type: String, trim: true },
        description: { type: String, trim: true },
        isOnline: { type: Boolean, default: false },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
      }, { _id: false }),
      default: undefined
    },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', userSchema);
