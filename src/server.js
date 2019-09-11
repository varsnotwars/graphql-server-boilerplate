import { createConnection } from 'typeorm';
// import { GraphQLServer } from 'graphql-yoga';

import express from 'express';
import { ApolloServer, gql, sch } from 'apollo-server-express';

import * as path from 'path';

import { resolvers } from './resolvers';
import { typeDefs } from './schema';

export const createApolloServer = () => new ApolloServer({ typeDefs, resolvers });

export const createOrmConnection = async () => createConnection();

export const createExpressApp = () => express();

export const startApplication = async () => {
    const apolloServer = createApolloServer();
    const typeORMConnection = await createOrmConnection();
    const app = createExpressApp();

    apolloServer.applyMiddleware({ app });

    const expressServer = await app.listen({ port: 4000 });

    console.log(`🚀 Server ready at http://localhost:4000${apolloServer.graphqlPath}`);

    return { expressServer, typeORMConnection };
};
