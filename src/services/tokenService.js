import jwt from "jsonwebtoken";
// TODO: creare separate secrets for confirm and reset?
import { SECRET } from "../server";

const defaultConfirmOptions = { expiresIn: "1d" };
const defaultResetOptions = { expiresIn: "20m" };

export const tokenService = {
  // TODO: need a better approach for confirmation tokens
  // something that can be invalidated etc
  createConfirmAccountToken: (payload, customOptions) =>
    jwt.sign(payload, SECRET, customOptions || defaultConfirmOptions),

  createResetPasswordToken: (payload, customOptions) =>
    jwt.sign(payload, SECRET, customOptions || defaultResetOptions)
};
