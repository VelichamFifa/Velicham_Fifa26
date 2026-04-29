import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityResult extends Document {
  communityId: string;
  communityWeightagePoint: number;
  matchId: string;
  matchTag: string;
  communityMatchPoint: number;
  totalCommunityPoint: number;
  dailyRank: number;
  finalRank: number;
  createdAt: Date;
  updatedAt: Date;
}

const communityResultSchema = new Schema<ICommunityResult>(
  {
    communityId: {
      type: String,
      required: true,
      ref: 'Community',
    },
    communityWeightagePoint: {
      type: Number,
      default: 1,
    },
    matchId: {
      type: String,
      required: true,
      ref: 'Match',
    },
    matchTag: {
      type: String,
      required: true,
    },
    communityMatchPoint: {
      type: Number,
      default: 0,
    },
    totalCommunityPoint: {
      type: Number,
      default: 0,
    },
    dailyRank: {
      type: Number,
    },
    finalRank: {
      type: Number,
    },
  },
  { timestamps: true }
);

communityResultSchema.index({ communityId: 1, matchId: 1 });

export const CommunityResult = mongoose.model<ICommunityResult>(
  'CommunityResult',
  communityResultSchema
);
