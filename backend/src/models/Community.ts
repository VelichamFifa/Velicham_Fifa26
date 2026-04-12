import mongoose, { Document, Schema } from 'mongoose';

export interface ICommunity extends Document {
  Community_ID: string;
  Name: string;
  State: string;
  City: string;
  President_Name: string;
  Creation_Time: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema: Schema = new Schema(
  {
    Community_ID: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    Name: {
      type: Schema.Types.String,
      required: true
    },
    State: {
      type: Schema.Types.String,
      required: true
    },
    City: {
      type: Schema.Types.String,
      required: true
    },
    President_Name: {
      type: Schema.Types.String,
      required: true
    },
    Creation_Time: {
      type: Schema.Types.Date,
      default: Date.now
    }
  },
  {
    collection: 'communities',
    timestamps: true
  }
);

export const Community = mongoose.model<ICommunity>('Community', CommunitySchema);
