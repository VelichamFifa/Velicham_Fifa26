import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  teamId: string;
  teamName: string;
  country: string;
  coach: string;
  foundedYear: number;
  createdAt: Date;
  updatedAt: Date;
}

const teamSchema = new Schema<ITeam>(
  {
    teamId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    teamName: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      required: true,
      trim: true,
    },
    coach: {
      type: String,
      trim: true,
    },
    foundedYear: {
      type: Number,
    },
  },
  { timestamps: true }
);

export const Team = mongoose.model<ITeam>('Team', teamSchema);
