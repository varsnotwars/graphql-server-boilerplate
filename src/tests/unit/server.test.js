import { createApolloServer, createOrmConnection, createExpressApp } from '../../server';

describe('[UNIT] [ACTION]: Start [Service] Server/Database', () => {
  test('creates and starts apollo server with express', async () => {
    const apolloServer = createApolloServer();
    const app = createExpressApp();

    apolloServer.applyMiddleware({ app });

    const expressServer = app.listen({ port: 4000 });

    expect(expressServer.listening).toBe(true);

    expressServer.close();

  });

  test('creates typeorm connection', async () => {
    const conn = await createOrmConnection();

    expect(conn.isConnected).toBe(true);

    await conn.close();
  });

});
