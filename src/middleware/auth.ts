import { verify, sign } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { ObjectId } from "mongodb";

const SECRET = "123456789" as string;

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  console.log(authHeader);

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    console.log(token);
    verify(token, SECRET, (err, decoded) => {
      console.log("decode", decoded);

      if (err) {
        return res.sendStatus(403);
      }
      res.locals.user = decoded;
      next();
    });
  } else {
    return res.sendStatus(401);
  }
};

export const generateToken = (username: string, _id: ObjectId) => {
  const id = _id.toString();
  return sign({ username, id }, SECRET, {
    algorithm: "HS256",
    expiresIn: "60 min",
  });
};
