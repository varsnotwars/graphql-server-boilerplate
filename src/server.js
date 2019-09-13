import { createConnection, getConnectionOptions, getConnection } from 'typeorm';
import express from 'express';
import { ApolloServer, gql, sch } from 'apollo-server-express';
import jwt from 'jsonwebtoken';
import * as path from 'path';
import nodemailer from 'nodemailer';
import session from 'express-session';
import cors from 'cors';
import connectMysql from 'express-mysql-session';

import { resolvers } from './resolvers';
import { typeDefs } from './schema';
import { User } from './entity/User';
import dotenv from 'dotenv';
dotenv.config();

// do not use this secret, create a cryptographically secure random number
// this is only exported so it can be used in tests
// TODO; move to .env file
export const SECRET = 'declare vars not wars';
const SESSION_SECRET = 'keyboardcat';

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
            session: req
                ? req.session
                : null,
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

    const MySQLStore = connectMysql(session);
    const { host, port, username: user, password, database } = await getConnectionOptions(process.env.NODE_ENV);
    const sessionStore = new MySQLStore({
        host,
        port,
        user,
        password,
        database
    });

    console.log(sessionStore);

    app.use(session({
        name: 'id',
        store: sessionStore,
        secret: SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        }
    }));

    app.use(cors());

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

    apolloServer.applyMiddleware({ app });

    const expressServer = await app.listen({ port: 4000 });

    console.log(`🚀 Server ready at http://localhost:4000${apolloServer.graphqlPath}`);

    return { expressServer, typeORMConnection };
};
