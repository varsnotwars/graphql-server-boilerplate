import { Query as userQueries, Mutation as userMutations } from "./user";
import { Query as authQueries, Mutation as authMutations } from "./auth";
import {
  Query as passwordQueries,
  Mutation as passwordMutations
} from "./accountManagement";

export const resolvers = {
  Query: {
    ...userQueries,
    ...authQueries,
    ...passwordQueries
  },
  Mutation: {
    ...userMutations,
    ...authMutations,
    ...passwordMutations
  }
};
