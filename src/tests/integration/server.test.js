import { createServer, createOrmConnection, startServer } from '../../server';

test('starts server', async () => {
    const { httpServer, typeORMConnection } = await startServer();

    const httpIsListening = httpServer.listening;
    const ormIsConnected = typeORMConnection.isConnected;

    expect(httpIsListening && ormIsConnected).toBe(true);

    httpServer.close();
    await typeORMConnection.close();
});
