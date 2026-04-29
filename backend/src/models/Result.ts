import mongoose, { Schema, Document } from 'mongoose';

export interface IResult extends Document {
  userId: string;
  userName: string;
  matchId: string;
  matchTag: string;
  result: 'win' | 'loss' | 'draw';
  matchPoints: number;
  finalPoints: number;
  communityId1?: string;
  communityId2?: string;
  dailyRank: number;
  finalRank: number;
  createdAt: Date;
  updatedAt: Date;
}

const resultSchema = new Schema<IResult>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    userName: {
      type: String,
      required: true,
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
    result: {
      type: String,
      enum: ['win', 'loss', 'draw'],
      required: true,
    },
    matchPoints: {
      type: Number,
      default: 0,
    },
    finalPoints: {
      type: Number,
      default: 0,
    },
    communityId1: {
      type: String,
    },
    communityId2: {
      type: String,
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

resultSchema.index({ userId: 1, matchId: 1 });
resultSchema.index({ matchId: 1 });

export const Result = mongoose.model<IResult>('Result', resultSchema);
