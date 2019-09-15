import { createTestClient } from "apollo-server-testing";
import jwt from 'jsonwebtoken';
import { gql } from 'apollo-server-express';
import axios from 'axios';

import { createApolloServer, createOrmConnection, getOrmConnection, SECRET, startApplication } from '../../server';
import { invalidLogin, unconfirmedUser } from '../../validation/errorMessages';
import { emailService } from '../../services/email/emailService';

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
                email
            }
        }
    `;

    const USER_PROFILE = gql`
        query me {
            me {
                id
                email
            }
        }
`;

    let expressServer, apolloServer, typeORMConnection, environment;


    let mutate, query;

    const testEmail = 'test@test.com';
    const testPassword = 'password';

    beforeEach(async () => {
        const app = await startApplication();
        const client = createTestClient(apolloServer);
        console.log(client);
        mutate = client.mutate;
        query = client.query;
        expressServer = app.expressServer;
        apolloServer = app.apolloServer;
        typeORMConnection = app.typeORMConnection
        environment = app.environment;

    });

    afterEach(async () => {
        expressServer.close();
        await typeORMConnection.close();
    });

    // test('can create a valid jwt for a new user', async () => {
    //     const result = await mutate({
    //         mutation: REGISTER_USER,
    //         variables: {
    //             email: testEmail,
    //             password: testPassword
    //         }
    //     });
    //     expect(!result.errors).toBe(true);
    //     expect(!!result.data.register).toBe(true);

    //     const { id } = result.data.register;

    //     const token = await jwt.sign({ id }, SECRET, { expiresIn: '1m' });

    //     jwt.verify(token, SECRET, async (err, decoded) => {
    //         expect(!err).toBe(true);
    //         expect(decoded.id).toBe(id);
    //     });
    // });

    // test('login will throw error when email not found', async () => {
    //     const result = await mutate({
    //         mutation: LOGIN_USER,
    //         variables: {
    //             email: testEmail,
    //             password: testPassword
    //         }
    //     });

    //     expect(result.errors).toBeTruthy();
    //     expect(result.errors.length).not.toBe(0);
    //     expect(result.errors.some(e => e === invalidLogin));
    // });

    // test('login will throw error when not confirmed', async () => {
    //     const registerResult = await mutate({
    //         mutation: REGISTER_USER,
    //         variables: {
    //             email: testEmail,
    //             password: testPassword
    //         }
    //     });

    //     expect(registerResult.errors).toBeFalsy();
    //     expect(registerResult.data.register).toBeTruthy();
    //     expect(registerResult.data.register.confirmed).toBeFalsy();

    //     const loginResult = await mutate({
    //         mutation: LOGIN_USER,
    //         variables: {
    //             email: testEmail,
    //             password: testPassword
    //         }
    //     });

    //     expect(loginResult.errors).toBeTruthy();
    //     expect(loginResult.errors.length).not.toBe(0);
    //     expect(loginResult.errors.some(e => e === unconfirmedUser));
    // });

    test('can get logged in user', async () => {
        // create confirmed user
        const registerResult = await mutate({
            mutation: REGISTER_USER,
            variables: {
                email: testEmail,
                password: testPassword
            }
        });

        expect(registerResult.errors).toBeFalsy();
        expect(registerResult.data.register).toBeTruthy();

        const token = await jwt.sign({ id: registerResult.data.register.id }, SECRET, { expiresIn: '5m' });
        const link = emailService.createConfirmationLink(`${environment.host}:${environment.port}`);
        console.log(link);

        // confirm user
        await axios.get(link);

        // login
        const loginResult = await mutate({
            mutation: LOGIN_USER,
            variables: {
                email: testEmail,
                password: testPassword
            }
        });

        expect(loginResult.errors).toBeFalsy();
        expect(registerResult.data.login).toBeTruthy();

        const profileResult = await query({
            query: USER_PROFILE
        });

        console.log(profileResult);


        // const loginResult = await mutate({
        //     mutation: LOGIN_USER,
        //     variables: {
        //         email: testEmail,
        //         password: testPassword
        //     }
        // });

        // expect(loginResult.errors).toBeTruthy();
        // expect(loginResult.errors.length).not.toBe(0);
        // expect(loginResult.errors.some(e => e === unconfirmedUser));
    });
});