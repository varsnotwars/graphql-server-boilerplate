import { createResolver } from "apollo-resolvers";
import { isInstance } from "apollo-errors";
import { UnknownError } from "../errors/graphqlErrors";

export const baseResolver = createResolver(
  //incoming requests will pass through this resolver like a no-op
  null,

  /*
        Only mask outgoing errors that aren't already apollo-errors,
        such as ORM errors etc
      */
  (_root, _args, _context, error) =>
    isInstance(error) ? error : new UnknownError()
);
