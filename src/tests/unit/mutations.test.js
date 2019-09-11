import { createTestClient } from 'apollo-server-testing';
import { createServer } from '../../server';


test('', async () => {
    const server = createServer();
    const {} = createTestClient(server);
});
