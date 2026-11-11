import jwt from "jsonwebtoken";

const createAccessToken = (userId, role) => {
  return jwt.sign(
    { sub: userId, role: role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  );
};

const createRefreshToken = (sessionId, userId, role, remainingTimeInSeconds) => {
  return jwt.sign(
    { sub: userId, jti: sessionId, role: role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: remainingTimeInSeconds }
  );
};

export default { createAccessToken, createRefreshToken };