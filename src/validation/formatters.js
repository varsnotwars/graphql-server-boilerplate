import { UserInputError } from "apollo-server-express";

export const createFromYupError = e => new UserInputError(e.message);
