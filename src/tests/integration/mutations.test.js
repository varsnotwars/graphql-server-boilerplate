import { createTestClient } from 'apollo-server-testing';
import { createApolloServer, createOrmConnection } from '../../server';
import { gql } from 'apollo-server-express'

// TODO: implement mock response using:
// https://github.com/apollographql/fullstack-tutorial/blob/master/final/server/src/__tests__/integration.js
test('[INTEGRATION]: can register user', async () => {
    const apolloServer = createApolloServer();
    const typeORMConnection = await createOrmConnection();

    const { mutate } = createTestClient(apolloServer);

    const REGISTER_USER = gql`
        mutation register($email: String!, $password: String!) {
            register(email: $email, password: $password)
        }
    `;

    const result = await mutate({
        mutation: REGISTER_USER,
        variables: { email: 'test@test.com', password: 'password' }
    });

    expect(!result.errors && result.data.register).toBe(true);

    await typeORMConnection.close();
});
