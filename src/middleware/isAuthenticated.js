import { AuthenticationRequiredError } from "../errors/graphqlErrors";
import { baseResolver } from "./baseResolver";

export const isAuthenticated = baseResolver.createResolver(
  (_parent, _args, { req: { session } }) => {
    if (!session.userId) {
      throw new AuthenticationRequiredError();
    }
  }
);
