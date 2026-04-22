import mongoose, { Document, Schema } from 'mongoose';

export interface IMatch extends Document {
  matchId: string;
  LDF: string;
  UDF: string;
  NDA: string;
  IsFinalized: boolean;
  official_UDF?: number;
  official_LDF?: number;
  official_NDA?: number;
  createdAt: Date;
  updatedAt: Date;
  prediction_end_date: Date;
}

const MatchSchema: Schema = new Schema<IMatch>(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    LDF: {
      type: Schema.Types.String,
      required: true
    },
    UDF: {
      type: Schema.Types.String,
      required: true
    },
    NDA: {
      type: Schema.Types.String,
      required: true
    },
    IsFinalized: {
      type: Schema.Types.Boolean,
      default: false
    },
    official_UDF: {
      type: Schema.Types.Number
    },
    official_LDF: {
      type: Schema.Types.Number
    },
    official_NDA: {
      type: Schema.Types.Number
    },
    prediction_end_date: {
      type: Schema.Types.Date
    }
  },
  {
    collection: 'matches',
    timestamps: true
  }
);

export const Match = mongoose.model<IMatch>('Match', MatchSchema);
