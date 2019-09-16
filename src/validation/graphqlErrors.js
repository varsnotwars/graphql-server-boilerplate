import { createError } from "apollo-errors";
import {
  mustBeLoggedIn,
  invalidEmail,
  unknownError,
  unconfirmedUser,
  emailAlreadyRegistered
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
  message: invalidEmail
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
