import { createConnection } from "typeorm";
import { User } from "./entity/User";
import { GraphQLServer } from 'graphql-yoga';

import { resolvers } from './resolvers'

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers: resolvers
});

createConnection().then(async connection => {
  server.start(() => console.log('Server is running on localhost:4000'));
}).catch(error => console.error(error));
