import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityLeader extends Document {
  rank: number;
  totalPoints: number;
  communityName: string;
  communityId: string;
  createdAt: Date;
  updatedAt: Date;
}

const communityLeaderSchema = new Schema<ICommunityLeader>(
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
  },
  { timestamps: true }
);

export const CommunityLeader = mongoose.model<ICommunityLeader>(
  'CommunityLeader',
  communityLeaderSchema
);
