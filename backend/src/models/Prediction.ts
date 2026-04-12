import mongoose, { Document, Schema } from 'mongoose';

export interface IPrediction extends Document {
  email: string;
  User_ID: string;
  matchId: string;
  UDF_Score: number;
  LDF_Score: number;
  NDA_Score: number;
  Total_Points: number;
  Last_Submitted_Time: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema: Schema = new Schema(
  {
    Email: {
      type: Schema.Types.String,
      required: true,
      index: true
    },
    User_ID: {
      type: String,
      required: true,
      index: true
    },
    matchId: {
      type: String,
      required: true,
      index: true
    },
    UDF_Score: {
      type: Schema.Types.Number,
      required: true,
      min: 0,
      max: 140
    },
    LDF_Score: {
      type: Schema.Types.Number,
      required: true,
      min: 0,
      max: 140
    },
    NDA_Score: {
      type: Schema.Types.Number,
      required: true,
      min: 0,
      max: 140
    },
    Total_Points: {
      type: Schema.Types.Number,
      default: 0
    },
    Last_Submitted_Time: {
      type: Schema.Types.Date,
      default: Date.now
    }
  },
  {
    collection: 'predictions',
    timestamps: true
  }
);

// Compound unique index for Email + matchId
PredictionSchema.index({ Email: 1, matchId: 1 }, { unique: true });

export const Prediction = mongoose.model<IPrediction>('Prediction', PredictionSchema);
