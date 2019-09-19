import { createError } from "apollo-errors";
import {
  mustBeLoggedIn,
  unknownError,
  unconfirmedUser,
  emailAlreadyRegistered,
  invalidToken,
  invalidLogin
} from "./errorMessages";

export const UnknownError = createError("UnknownError", {
  message: unknownError
});

export const AuthenticationRequiredError = createError(
  "AuthenticationRequiredError",
  {
    message: mustBeLoggedIn
  }
);

export const InvalidLoginError = createError("InvalidLoginError", {
  message: invalidLogin
});

export const UnconfirmedUserError = createError("UnconfirmedUserError", {
  message: unconfirmedUser
});

export const EmailAlreadyRegisteredError = createError(
  "EmailAlreadyRegisteredError",
  {
    message: emailAlreadyRegistered
  }
);

export const TokenError = createError("TokenError", {
  message: invalidToken
});
