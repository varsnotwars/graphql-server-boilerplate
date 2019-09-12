import { gql } from 'apollo-server-express';

export const typeDefs = gql`
    type Query {
        hello(name: String): String!
    }

    type User {
        id: ID!
        email: String
        confirmed: Boolean!
    }

    type Mutation {
        register(email: String!, password: String!): User!
}`;