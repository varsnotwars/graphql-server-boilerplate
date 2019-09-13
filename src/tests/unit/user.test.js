import { createApolloServer, createOrmConnection, getOrmConnection, SECRET } from '../../server';
import { createTestClient } from "apollo-server-testing";
import jwt from 'jsonwebtoken';
import { gql } from 'apollo-server-express';

describe('[UNIT] [ACTION]: Create [SERVICE]: Authentication/Authorization', () => {
    const REGISTER_USER = gql`
        mutation register($email: String!, $password: String!) {
            register(email: $email, password: $password) {
                id
            }
        }
    `;

    const apolloServer = createApolloServer();

    const { mutate } = createTestClient(apolloServer)

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
                email: 'test@test.com',
                password: 'password'
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
});