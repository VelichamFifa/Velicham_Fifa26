import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyCommunityLeader extends Document {
  rank: number;
  totalPoints: number;
  communityName: string;
  communityId: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dailyCommunityLeaderSchema = new Schema<IDailyCommunityLeader>(
  {
    rank: {
      type: Number,
      required: true,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    communityName: {
      type: String,
      required: true,
    },
    communityId: {
      type: String,
      required: true,
      ref: 'Community',
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

dailyCommunityLeaderSchema.index({ date: 1 });

dailyCommunityLeaderSchema.index({ communityId: 1, date: 1 });

export const DailyCommunityLeader = mongoose.model<IDailyCommunityLeader>(
  'DailyCommunityLeader',
  dailyCommunityLeaderSchema
);
