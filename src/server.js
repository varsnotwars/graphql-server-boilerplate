import { createConnection, getConnectionOptions, getConnection } from 'typeorm';
import express from 'express';
import { ApolloServer, gql, sch } from 'apollo-server-express';
import jwt from 'jsonwebtoken';
import * as path from 'path';
import nodemailer from 'nodemailer';


import { resolvers } from './resolvers';
import { typeDefs } from './schema';
import { User } from './entity/User';
import dotenv from 'dotenv';
dotenv.config();

// do not use this secret, create a cryptographically secure random number
// this is only exported so it can be used in tests
export const SECRET = 'declare vars not wars';

export const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    },
    debug: true // include SMTP traffic in the logs
});

export const createApolloServer = () => new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
        return {
            SECRET,
            origin: req && req.headers
                ? req.headers.origin
                : null
        };
    }
});

export const createOrmConnection = async connName => {
    const connectionOptions = await getConnectionOptions(process.env.NODE_ENV);
    return createConnection({ ...connectionOptions, name: connName || "default" });
}
export const getOrmConnection = connName => getConnection(connName);

export const createExpressApp = () => express();

export const startApplication = async () => {
    const apolloServer = createApolloServer();
    const typeORMConnection = await createOrmConnection();
    const app = createExpressApp();

    apolloServer.applyMiddleware({ app });

    app.get('/confirm/:token', async (req, res) => {
        const { token } = req.params;

        jwt.verify(token, SECRET, async (err, decoded) => {
            if (err) {
                res.send(err);
            } else {
                const { id } = decoded;
                const user = await User.findOne({ where: { id }, select: ['id', 'confirmed'] });

                if (user) {
                    if (user.confirmed) {
                        // cannot invalidated jwt, they must expire

                        res.send('already confirmed');
                    } else {
                        // QueryBuilder is most performant
                        const updateRes = await typeORMConnection
                            .createQueryBuilder()
                            .update(User)
                            .set({ confirmed: true })
                            .where('id = :id', { id })
                            .execute();

                        res.send('user has been confirmed');
                    }

                } else {
                    res.send('user not found');
                }
            }
        });
    });

    const expressServer = await app.listen({ port: 4000 });

    console.log(`🚀 Server ready at http://localhost:4000${apolloServer.graphqlPath}`);

    return { expressServer, typeORMConnection };
};
