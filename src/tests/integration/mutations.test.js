import { createTestClient } from 'apollo-server-testing';
import { createApolloServer, createOrmConnection } from '../../server';
import { gql } from 'apollo-server-express'
import { User } from '../../entity/User';

// TODO: use beforeAll for creating the ormconnection

test('[INTEGRATION]: can register user', async () => {
    const apolloServer = createApolloServer();
    const typeORMConnection = await createOrmConnection();

    const { mutate } = createTestClient(apolloServer);

    const REGISTER_USER = gql`
        mutation register($email: String!, $password: String!) {
            register(email: $email, password: $password) {
                id
                email
            }
        }
    `;

    const result = await mutate({
        mutation: REGISTER_USER,
        variables: {
            email: 'test@test.com',
            password: 'password'
        }
    });

    expect(!result.errors).toBe(true);
    expect(!!result.data.register).toBe(true);

    const { email } = result.data.register;

    expect(email).toEqual(email);

    await typeORMConnection.close();
});
