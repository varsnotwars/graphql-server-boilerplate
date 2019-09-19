import { AuthenticationRequiredError } from "../errors/graphqlErrors";
import { baseResolver } from "./baseResolver";

export const isAuthenticated = baseResolver.createResolver(
  (parent, args, { req: { session } }, info) => {
    if (!session.userId) {
      throw new AuthenticationRequiredError();
    }
  }
);
