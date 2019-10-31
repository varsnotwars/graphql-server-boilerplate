import { Query as userQueries, Mutation as userMutations } from "./user";
import { Query as authQueries, Mutation as authMutations } from "./auth";
import {
  Query as accountQueries,
  Mutation as accountMutations
} from "./accountManagement";

export const resolvers = {
  Query: {
    ...userQueries,
    ...authQueries,
    ...accountQueries
  },
  Mutation: {
    ...userMutations,
    ...authMutations,
    ...accountMutations
  }
};
