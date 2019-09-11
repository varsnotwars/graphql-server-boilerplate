import { createApolloServer, createOrmConnection, createExpressApp } from '../../server';

// TODO: added ignore path to package.json to ignore /dist folder test
// need to see whether we should be creating test in dist or not/and testing or not

test('[UNIT]: creates and starts apollo server with express', async () => {
  const apolloServer = createApolloServer();
  const app = createExpressApp();

  apolloServer.applyMiddleware({ app });

  const expressServer = app.listen({ port: 4000 });

  expect(expressServer.listening).toBe(true);

  expressServer.close();

});

test('[UNIT]: creates typeorm connection', async () => {
  const conn = await createOrmConnection();

  expect(conn.isConnected).toBe(true);

  await conn.close();
});
