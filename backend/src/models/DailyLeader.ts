import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyLeader extends Document {
  rank: number;
  totalPoints: number;
  name: string;
  state: string;
  community1?: string;
  community2?: string;
  userId: string;
  email: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dailyLeaderSchema = new Schema<IDailyLeader>(
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
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

dailyLeaderSchema.index({ date: 1 });

export const DailyLeader = mongoose.model<IDailyLeader>('DailyLeader', dailyLeaderSchema);
