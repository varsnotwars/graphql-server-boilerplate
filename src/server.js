import { createConnection } from 'typeorm';
import { GraphQLServer } from 'graphql-yoga';
import * as path from 'path';

import { resolvers } from './resolvers';

const schemaPath = path.join(__dirname, '../src/schema.graphql');

export const createServer = () => new GraphQLServer({ typeDefs: schemaPath, resolvers });

export const createOrmConnection = async () => createConnection();

export const startServer = async () => {
    const server = createServer();

    await createOrmConnection();

    await server.start();

    console.log('Server is running on localhost:4000')
};
