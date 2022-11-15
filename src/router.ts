import { Router } from "express";
import {
  guestValidationSchema,
  loginValidationSchema,
  userValidationSchema,
} from "./helpers/validation";
import UserModel from "./models/User";
import { Request, Response } from "express";
import { generateToken, verifyToken } from "./middleware";
import io from "./socketio";
import ResultModel from "./models/Result";
import { hash, compare } from "bcryptjs";
import RankModel from "./models/Rank";
import ReplayModel from "./models/Replay";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  res.send("WSA-SERVER");
});

router.post("/api/auth/register", async (req: Request, res: Response) => {
  const newUser = req.body;
  console.log(!newUser.email);

  if (!newUser.email) {
    try {
      guestValidationSchema.parse(newUser);
      const user = await UserModel.create(newUser);
      const token = generateToken(user.name, user._id);
      res.send({ user, token });
    } catch (error) {
      console.log(error);
      res.status(401).send(error);
    }
  } else {
    try {
      userValidationSchema.parse(newUser);

      hash(newUser.password, 10, async (err, hash) => {
        const user = await UserModel.create({ ...newUser, password: hash });
        const token = generateToken(user.name, user._id);
        res.send({ user, token });
      });
    } catch (error) {
      console.log("ERROR");
      res.status(401).send(error);
    }
  }
});

router.post("/api/auth/login", async (req: Request, res: Response) => {
  const newUser = req.body;

  try {
    loginValidationSchema.parse(newUser);

    const user = await UserModel.findOne({ email: newUser.email });
    console.log("user", user);
    if (!user) {
      res.status(401).send("User not found");
      return;
    }
    compare(newUser.password, user.password, function (err, result) {
      if (result) {
        const token = generateToken(user.name, user._id);
        res.send({ user, token });
      } else {
        res.status(401).send("Wrong password");
      }
    });
  } catch (error) {
    console.log("ERROR");
    res.status(401).send(error);
  }
});

router.get(
  "/api/auth/users",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const users = await UserModel.find({});

      res.send(users);
    } catch (error) {
      console.log("ERROR");
      res.send(error);
    }
  }
);

router.get("/api/results", verifyToken, async (req: Request, res: Response) => {
  const limit = req.query.limit;
  console.log("limit", limit);
  try {
    const results = await ResultModel.find({}).limit(Number(limit));

    res.send(results);
  } catch (error) {
    console.log("ERROR");
    res.send(error);
  }
});

router.get(
  "/api/results/:id",
  verifyToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    const limit = req.params.limit;
    try {
      const results = await ResultModel.find({
        $or: [{ playerX: id }, { playerO: id }],
      });

      res.send(results);
    } catch (error) {
      console.log("ERROR");
      res.send(error);
    }
  }
);

router.get(
  "/api/auth/active",
  verifyToken,
  async (req: Request, res: Response) => {
    try {
      const user = await UserModel.findOne({ _id: res.locals.user.id });

      res.send({ user: user });
    } catch (error) {
      console.log("ERROR");
      res.send(error);
    }
  }
);
router.get(
  "/api/user/:id",
  verifyToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const user = await UserModel.findOne({ _id: id });

      res.send({ user: user });
    } catch (error) {
      console.log("ERROR");
      res.send(error);
    }
  }
);

router.put(
  "/api/user/:id",
  verifyToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;
    // update user
    try {
      if (req.body.password) {
        hash(req.body.password, 10, async (err, hash) => {
          const user = await UserModel.findOneAndUpdate(
            { _id: id },
            { ...req.body, password: hash }
          ).exec();
          res.send({ user: user });
        });
      } else {
        const user = await UserModel.findOneAndUpdate(
          { _id: id },
          { ...req.body }
        ).exec();
        res.send({ user: user });
      }
    } catch (error) {
      console.log("ERROR");
      res.send(error);
    }
  }
);

router.get("/api/users", verifyToken, async (req: Request, res: Response) => {
  const id = req.params.id;

  try {
    const users = await UserModel.find({});

    res.send(users);
  } catch (error) {
    console.log("ERROR");
    res.send(error);
  }
});
router.get("/api/ranks", verifyToken, async (req: Request, res: Response) => {
  try {
    const ranks = await RankModel.find();

    res.send({ ranks });
  } catch (error) {
    console.log("ERROR");
    res.send(error);
  }
});
router.get(
  "/api/ranks/:id",
  verifyToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const rank = await RankModel.findOne({ userId: id });

      res.send({ rank });
    } catch (error) {
      console.log("ERROR");
      res.send(error);
    }
  }
);

router.get(
  "/api/replay/:id",
  verifyToken,
  async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const replay = await ReplayModel.findOne({ resultId: id });

      res.send({ replay });
    } catch (error) {
      console.log("ERROR");
      res.send(error);
    }
  }
);

export default router;
