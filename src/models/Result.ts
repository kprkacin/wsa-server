import { Schema, model } from "mongoose";
import { IResult } from "../types/IResult";
const resultSchema = new Schema<IResult>(
  {
    playerX: { type: String, required: true },
    playerO: { type: String, required: true },
    winner: { type: String, required: true },
  },
  { timestamps: true }
);

const ResultModel = model<IResult>("Result", resultSchema);
export default ResultModel;
