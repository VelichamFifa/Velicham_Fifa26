import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunity extends Document {
  communityId: string;
  name: string;
  fullName?: string;
  isOnline?: boolean;
  state: string;
  city: string;
  address: string;
  description?: string;
  creationTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

const communitySchema = new Schema<ICommunity>(
  {
    communityId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    creationTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Community = mongoose.model<ICommunity>('Community', communitySchema);
