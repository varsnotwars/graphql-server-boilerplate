import { createServer, createOrmConnection, startServer } from '../../server';

// TODO: added ignore path to package.json to ignore /dist folder test
// need to see whether we should be creating test in dist or not/and testing or not

test('creates GraphQLServer', () => {
  expect(createServer).toBeDefined();
});

test('creates typeorm connection', async () => {
  const conn = await createOrmConnection();

  expect(conn).toBeDefined();

  await conn.close();
});

test('starts server', async () => {
  const server = await startServer();

  expect(server).toBeDefined();

  server.httpServer.close();
  await server.typeORMConnection.close();
});
