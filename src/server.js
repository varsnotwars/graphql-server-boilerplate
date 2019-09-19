import { createConnection, getConnectionOptions, getConnection } from "typeorm";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import session from "express-session";
import cors from "cors";
import connectMysql from "express-mysql-session";
import rateLimit from "express-rate-limit";

import { resolvers } from "./resolvers";
import { typeDefs } from "./schema";

import { User } from "./entity/User";

import dotenv from "dotenv";
dotenv.config();

// do not use this secret, create a cryptographically secure random number
// this is only exported so it can be used in tests
// TODO; move to .env file
export const SECRET = "declare vars not wars";
const SESSION_SECRET = "keyboardcat";

export const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  },
  debug: true // include SMTP traffic in the logs
});

export const createApolloServer = () =>
  new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      return {
        SECRET,
        req,
        origin: req && req.headers ? req.headers.origin : null
      };
    }
  });

export const createOrmConnection = async connName => {
  const connectionOptions = await getConnectionOptions(process.env.NODE_ENV);
  return createConnection({
    ...connectionOptions,
    name: connName || "default"
  });
};
export const getOrmConnection = connName => getConnection(connName);

export const createExpressApp = () => express();

export const startApplication = async () => {
  const envConfig = {
    test: {
      port: 4000,
      host: "http://localhost",
      graphqlPath: ""
    },
    development: {
      port: 4000,
      host: "http://localhost",
      graphqlPath: ""
    },
    production: {
      port: "",
      host: "",
      graphqlPath: ""
    }
  };

  const environment = envConfig[process.env.NODE_env];

  const apolloServer = createApolloServer();
  const typeORMConnection = await createOrmConnection();
  const app = createExpressApp();

  const MySQLStore = connectMysql(session);

  const {
    host,
    port,
    username: user,
    password,
    database
  } = await getConnectionOptions(process.env.NODE_ENV);

  const sessionStore = new MySQLStore({
    host,
    port,
    user,
    password,
    database
  });

  // using the graphql playground will reach lower limits as the playground constantly sends requests
  if (process.env.NODE_ENV === "production") {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });

    app.use(limiter);
  }

  app.use(
    session({
      name: "id",
      store: sessionStore,
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      }
    })
  );

  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST"],
      credentials: true // enable set cookie
    })
  );

  app.get("/confirm/:token", async (req, res) => {
    const { token } = req.params;

    jwt.verify(token, SECRET, async (err, decoded) => {
      if (err) {
        res.send(err);
      } else {
        const { id } = decoded;
        const user = await User.findOne({
          where: { id },
          select: ["id", "confirmed"]
        });

        if (user) {
          if (user.confirmed) {
            // cannot invalidated jwt, they must expire

            res.send("already confirmed");
          } else {
            // QueryBuilder is most performant
            const updateRes = await typeORMConnection
              .createQueryBuilder()
              .update(User)
              .set({ confirmed: true })
              .where("id = :id", { id })
              .execute();

            res.send("user has been confirmed");
          }
        } else {
          res.send("user not found");
        }
      }
    });
  });

  apolloServer.applyMiddleware({ app });

  const expressServer = await app.listen({ port: environment.port });
  // set environment graphql path
  environment.graphqlPath = apolloServer.graphqlPath;

  if (process.env.NODE_ENV !== "test") {
    console.log(
      `🚀 Server ready at ${environment.host}:${environment.port}${apolloServer.graphqlPath}`
    );
  }

  return {
    expressServer,
    typeORMConnection,
    apolloServer,
    environment
  };
};
