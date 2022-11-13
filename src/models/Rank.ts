import { Schema, model } from "mongoose";
import { IRank } from "../types/IRank";
const rankSchema = new Schema<IRank>(
  {
    userId: { type: String, required: true },
    wins: { type: Number, required: true, default: 0 },
    losses: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const RankModel = model<IRank>("Rank", rankSchema);
export default RankModel;
