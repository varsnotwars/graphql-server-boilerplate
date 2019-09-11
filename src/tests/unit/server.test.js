import { createServer, createOrmConnection, startServer } from '../../server';

// TODO: added ignore path to package.json to ignore /dist folder test
// need to see whether we should be creating test in dist or not/and testing or not

test('creates and starts GraphQLServer', async () => {
  const server = createServer();
  const httpServer = await server.start();

  expect(httpServer.listening).toBe(true);

  httpServer.close();
});

test('creates typeorm connection', async () => {
  const conn = await createOrmConnection();

  expect(conn.isConnected).toBe(true);

  await conn.close();
});

// TODO: move this to integration tests
test('starts server', async () => {
  const { httpServer, typeORMConnection } = await startServer();

  const httpIsListening = httpServer.listening;
  const ormIsConnected = typeORMConnection.isConnected;
  
  expect(httpIsListening && ormIsConnected).toBe(true);

  httpServer.close();
  await typeORMConnection.close();
});
