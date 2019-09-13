import { createTestClient } from 'apollo-server-testing';
import { createApolloServer, createOrmConnection, getOrmConnection } from '../../server';
import { gql } from 'apollo-server-express'
import { emailAlreadyRegistered, invalidEmail, passwordTooShort } from '../../validation/errorMessages';

describe('[UNIT] [ACTION]: Register [ENTITY]: User', () => {
    const REGISTER_USER = gql`
        mutation register($email: String!, $password: String!) {
            register(email: $email, password: $password) {
                id
            }
        }
    `;

    // we can resuse this as the api won't change between tests
    const apolloServer = createApolloServer();

    const { mutate } = createTestClient(apolloServer);

    beforeEach(async () => {
        await createOrmConnection('default');
    });

    afterEach(async () => {
        await getOrmConnection('default').close();
    });

    afterAll(async () => {
        // just in case
        const activeConn = await getOrmConnection('default');

        activeConn.isConnected
            ? await activeConn.close()
            : null;
    });

    test('can register user', async () => {
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
    });

    test('cannot register same email twice', async () => {
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
    });

    test('cannot register invalid email', async () => {
        const result = await mutate({
            mutation: REGISTER_USER,
            variables: {
                email: 'test.com',
                password: 'password'
            }
        });

        expect(result.errors.length).not.toBe(0);
        expect(result.errors.some(e => e.message === invalidEmail));
    });

    test('cannot register invalid password', async () => {
        const result = await mutate({
            mutation: REGISTER_USER,
            variables: {
                email: 'test@test.com',
                password: '1234567'
            }
        });

        expect(result.errors.length).not.toBe(0);
        expect(result.errors.some(e => e.message === passwordTooShort));
    });
});
