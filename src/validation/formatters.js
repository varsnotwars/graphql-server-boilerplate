import { UserInputError } from "apollo-server-express";


export const formatYupError = err => err.inner.map(e => new UserInputError(e.message));
