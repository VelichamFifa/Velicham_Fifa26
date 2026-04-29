import mongoose, { Schema, Document } from 'mongoose';

export interface ITopLeader extends Document {
  rank: number;
  totalPoints: number;
  name: string;
  state: string;
  community1?: string;
  community2?: string;
  userId: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const topLeaderSchema = new Schema<ITopLeader>(
  {
    rank: {
      type: Number,
      required: true,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    state: {
      type: String,
    },
    community1: {
      type: String,
    },
    community2: {
      type: String,
    },
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    email: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const TopLeader = mongoose.model<ITopLeader>('TopLeader', topLeaderSchema);
