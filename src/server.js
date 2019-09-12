import { createConnection, getConnectionOptions, getConnection } from 'typeorm';
import express from 'express';
import { ApolloServer, gql, sch } from 'apollo-server-express';
import jwt from 'jsonwebtoken';
import * as path from 'path';


import { resolvers } from './resolvers';
import { typeDefs } from './schema';
import { User } from './entity/User';



const SECRET = 'declare vars not wars';


export const createApolloServer = () => new ApolloServer({
    typeDefs,
    resolvers,
    context: async () => {
        return {
            SECRET
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
                const user = await User.findOne({ where: { id } });

                if (user) {
                    // QueryBuilder is most performant
                    const updateRes = await typeORMConnection
                        .createQueryBuilder()
                        .update(User)
                        .set({ confirmed: true })
                        .where('id = :id', { id })
                        .execute();

                    res.send('user has been confirmed');
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
