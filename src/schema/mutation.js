import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Mutation {
    register(email: String!, password: String!): User!
    login(email: String!, password: String!): User!
    logout(fromAll: Boolean): Boolean!
    resetPassword(token: String!, newPassword: String!): Boolean!
    verifyToken(token: String!): Boolean!
    confirmAccount(token: String!): Boolean!
    forgotPassword(email: String!): Boolean!
  }
`;
