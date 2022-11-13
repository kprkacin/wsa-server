import { Schema, model } from "mongoose";
import { IReplay } from "../types/IReplay";

const replaySchema = new Schema<IReplay>(
  {
    replay: { type: Array.of(Array), required: true },
    resultId: { type: String, required: true },
  },
  { timestamps: true }
);

const ReplayModel = model<IReplay>("Replay", replaySchema);
export default ReplayModel;
