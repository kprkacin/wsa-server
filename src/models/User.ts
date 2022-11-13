import { Schema, model } from "mongoose";
import { IUser } from "../types/IUser";
const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    password: { type: String, required: false },
    email: { type: String, required: false },
  },
  { timestamps: true }
);

const UserModel = model<IUser>("User", userSchema);
export default UserModel;
