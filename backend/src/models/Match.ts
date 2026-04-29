import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  matchId: string;
  sequence: number;
  team1: string;
  team2: string;
  team1Score?: number;
  team2Score?: number;
  matchTime: Date;
  predictionsEndingTime: Date;
  round: number;
  comment?: string;
  matchTag: string;
  status: 'scheduled' | 'ongoing' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const matchSchema = new Schema<IMatch>(
  {
    matchId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    sequence: {
      type: Number,
      required: true,
    },
    team1: {
      type: String,
      required: true,
      trim: true,
    },
    team2: {
      type: String,
      required: true,
      trim: true,
    },
    team1Score: {
      type: Number,
    },
    team2Score: {
      type: Number,
    },
    matchTime: {
      type: Date,
      required: true,
    },
    predictionsEndingTime: {
      type: Date,
      required: true,
    },
    round: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
    },
    matchTag: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'completed'],
      default: 'scheduled',
    },
  },
  { timestamps: true }
);

export const Match = mongoose.model<IMatch>('Match', matchSchema);
