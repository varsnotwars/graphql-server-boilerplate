import { createResolver } from "apollo-resolvers";
import { mustBeLoggedIn } from "../validation/errorMessages";
import { AuthenticationError } from "apollo-server-express";
import { isInstance } from "apollo-errors";
import { UnknownError } from "../validation/graphqlErrors";

const baseResolver = createResolver(
  //incoming requests will pass through this resolver like a no-op
  null,

  /*
      Only mask outgoing errors that aren't already apollo-errors,
      such as ORM errors etc
    */
  (root, args, context, error) =>
    isInstance(error) ? error : new UnknownError()
);

export const isAuthenticated = baseResolver.createResolver(
  (parent, args, { session }, info) => {
    console.log(session);
    if (!session.userId) {
      throw new AuthenticationError(mustBeLoggedIn);
    }
  }
);
