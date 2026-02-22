import mongoose, { Schema, Document } from 'mongoose';

export interface IPrediction extends Document {
  userId: string;
  email: string;
  matchId: string;
  matchTag: string;
  team1Score: number;
  team2Score: number;
  submittedTime: Date;
  points: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const predictionSchema = new Schema<IPrediction>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
    },
    email: {
      type: String,
      required: true,
    },
    matchId: {
      type: String,
      required: true,
    },
    matchTag: {
      type: String,
      required: true,
    },
    team1Score: {
      type: Number,
      required: true,
      min: 0,
    },
    team2Score: {
      type: Number,
      required: true,
      min: 0,
    },
    submittedTime: {
      type: Date,
      default: Date.now,
    },
    points: {
      type: Number,
      default: 0,
    },
    comment: {
      type: String,
    },
  },
  { timestamps: true }
);

// Compound index to ensure one prediction per user per match
predictionSchema.index({ userId: 1, matchId: 1 }, { unique: true });

export const Prediction = mongoose.model<IPrediction>('Prediction', predictionSchema);
