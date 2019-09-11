import { startApplication } from '../../server';

test('[INTEGRATION]: starts application', async () => {
    const { expressServer, typeORMConnection } = await startApplication();

    const expressIsListening = expressServer.listening;
    const ormIsConnected = typeORMConnection.isConnected;

    expect(expressIsListening && ormIsConnected).toBe(true);

    expressServer.close();
    await typeORMConnection.close();
});
