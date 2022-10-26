import { Router } from "express";
import { userValidationSchema } from "./helpers/validation";
import UserModel from "./models/User";
import { Request, Response } from "express";
import { generateToken, verifyToken } from "./middleware";
import io from "./socketio";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  res.send("WSA-SERVER");
});

router.post("/api/auth/guest", async (req: Request, res: Response) => {
  console.log(req, res);
  const newUser = req.body;
  try {
    userValidationSchema.parse(newUser);
    const user = await UserModel.create(newUser);
    const token = generateToken(user.name, user._id);
    res.send({ user, token });
  } catch (error) {
    console.log("ERROR");
    res.send(error);
  }
});

router.get(
  "/api/auth/users",
  verifyToken,
  async (req: Request, res: Response) => {
    console.log("in auth", res.locals.user);
    console.log(req, res);

    try {
      const users = await UserModel.find({});

      res.send(users);
    } catch (error) {
      console.log("ERROR");
      res.send(error);
    }
  }
);

export default router;
