"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = exports.verifyToken = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const SECRET = "123456789";
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (authHeader) {
        const token = authHeader.split(" ")[1];
        console.log(token);
        (0, jsonwebtoken_1.verify)(token, SECRET, (err, decoded) => {
            console.log("decode", decoded);
            if (err) {
                return res.sendStatus(403);
            }
            res.locals.user = decoded;
            next();
        });
    }
    else {
        return res.sendStatus(401);
    }
};
exports.verifyToken = verifyToken;
const generateToken = (username, _id) => {
    const id = _id.toString();
    return (0, jsonwebtoken_1.sign)({ username, id }, SECRET, {
        algorithm: "HS256",
        expiresIn: "60 min",
    });
};
exports.generateToken = generateToken;
