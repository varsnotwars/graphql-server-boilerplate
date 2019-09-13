import { createApolloServer, createOrmConnection, getOrmConnection, SECRET } from '../../server';
import { createTestClient } from "apollo-server-testing";
import jwt from 'jsonwebtoken';
import { gql } from 'apollo-server-express';
import { invalidLogin, unconfirmedUser } from '../../validation/errorMessages';

describe('[UNIT] [ACTION]: Create [SERVICE]: Authentication/Authorization', () => {
    const REGISTER_USER = gql`
        mutation register($email: String!, $password: String!) {
            register(email: $email, password: $password) {
                id
            }
        }
    `;
    const LOGIN_USER = gql`
        mutation login($email: String!, $password: String!) {
            login(email: $email, password: $password) {
                id
            }
        }
    `;

    const apolloServer = createApolloServer();

    const { mutate } = createTestClient(apolloServer)

    const testEmail = 'test@test.com';
    const testPassword = 'password';

    beforeEach(async () => {
        await createOrmConnection('default');
    });

    afterEach(async () => {
        await getOrmConnection('default').close();
    });

    test('can create a valid jwt for a new user', async () => {
        const result = await mutate({
            mutation: REGISTER_USER,
            variables: {
                email: testEmail,
                password: testPassword
            }
        });
        expect(!result.errors).toBe(true);
        expect(!!result.data.register).toBe(true);

        const { id } = result.data.register;

        const token = await jwt.sign({ id }, SECRET, { expiresIn: '1m' });

        jwt.verify(token, SECRET, async (err, decoded) => {
            expect(!err).toBe(true);
            expect(decoded.id).toBe(id);
        });
    });

    test('login will throw error when email not found', async () => {
        const result = await mutate({
            mutation: LOGIN_USER,
            variables: {
                email: testEmail,
                password: testPassword
            }
        });

        expect(result.errors).toBeTruthy();
        expect(result.errors.length).not.toBe(0);
        expect(result.errors.some(e => e === invalidLogin));
    });

    test('login will throw error when not confirmed', async () => {
        const registerResult = await mutate({
            mutation: REGISTER_USER,
            variables: {
                email: testEmail,
                password: testPassword
            }
        });

        expect(registerResult.errors).toBeFalsy();
        expect(registerResult.data.register).toBeTruthy();
        expect(registerResult.data.register.confirmed).toBeFalsy();

        const loginResult = await mutate({
            mutation: LOGIN_USER,
            variables: {
                email: testEmail,
                password: testPassword
            }
        });

        expect(loginResult.errors).toBeTruthy();
        expect(loginResult.errors.length).not.toBe(0);
        expect(loginResult.errors.some(e => e === unconfirmedUser));
    });
});