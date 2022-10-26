import { Schema, model } from "mongoose";
import { IUser } from "../types/IUser";
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
  },
  { timestamps: true }
);

const UserModel = model<IUser>("User", userSchema);
export default UserModel;
