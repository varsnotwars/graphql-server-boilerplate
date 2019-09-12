import { createTestClient } from 'apollo-server-testing';
import { createApolloServer, createOrmConnection } from '../../server';
import { gql } from 'apollo-server-express'
import { User } from '../../entity/User';
import { emailAlreadyRegistered, invalidEmail, passwordTooShort } from '../../validation/errorMessages';

beforeEach(() => { console.log('before all fired!!!!!!!!!!!!!!!!!!!') });

const REGISTER_USER = gql`
mutation register($email: String!, $password: String!) {
    register(email: $email, password: $password) {
        id
        email
    }
}
`;

// TODO: use beforeAll for creating the ormconnection
describe('[INTEGRATION]: [ACTION]: Register [ENTITY]: User', async () => {
    test('can register user', async () => {
        const apolloServer = createApolloServer();
        const typeORMConnection = await createOrmConnection();

        const { mutate } = createTestClient(apolloServer);

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

    test('cannot register same email twice', async () => {
        const apolloServer = createApolloServer();
        const typeORMConnection = await createOrmConnection();

        const { mutate } = createTestClient(apolloServer);

        const result1 = await mutate({
            mutation: REGISTER_USER,
            variables: {
                email: 'test@test.com',
                password: 'password'
            }
        });

        const result2 = await mutate({
            mutation: REGISTER_USER,
            variables: {
                email: 'test@test.com',
                password: 'password'
            }
        });


        expect(result2.errors.length).not.toBe(0);
        expect(result2.errors.some(e => e.message === emailAlreadyRegistered));
        await typeORMConnection.close();
    });

    test('cannot register invalid email', async () => {
        const apolloServer = createApolloServer();
        const typeORMConnection = await createOrmConnection();

        const { mutate } = createTestClient(apolloServer);

        const result = await mutate({
            mutation: REGISTER_USER,
            variables: {
                email: 'test.com',
                password: 'password'
            }
        });

        expect(result.errors.length).not.toBe(0);
        expect(result.errors.some(e => e.message === invalidEmail));
        await typeORMConnection.close();
    });

    test('cannot register invalid password', async () => {
        const apolloServer = createApolloServer();
        const typeORMConnection = await createOrmConnection();

        const { mutate } = createTestClient(apolloServer);

        const result = await mutate({
            mutation: REGISTER_USER,
            variables: {
                email: 'test@test.com',
                password: '1234567'
            }
        });

        expect(result.errors.length).not.toBe(0);
        expect(result.errors.some(e => e.message === passwordTooShort));

        await typeORMConnection.close();
    });
});
