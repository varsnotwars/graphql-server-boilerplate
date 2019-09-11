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
            register(email: $email, password: $password)
        }
    `;

    const email = 'test@test.com';
    const password = 'password';

    const result = await mutate({
        mutation: REGISTER_USER,
        variables: { email, password }
    });
    const createdUser = await User.findOne({ where: { email } })
    expect(!result.errors).toBe(true);
    expect(!!result.data.register).toBe(true);

    expect(createdUser.email).toEqual(email);
    expect(createdUser.password).not.toEqual(password);

    await typeORMConnection.close();
});
