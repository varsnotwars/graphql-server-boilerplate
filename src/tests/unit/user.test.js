import { createTestClient } from "apollo-server-testing";
import jwt from "jsonwebtoken";
import { gql } from "apollo-server-express";
import axios from "axios";
axios.defaults.withCredentials = true;
import { request } from "graphql-request";

import {
  createApolloServer,
  createOrmConnection,
  getOrmConnection,
  SECRET,
  startApplication
} from "../../server";
import { invalidLogin, unconfirmedUser } from "../../validation/errorMessages";
import { emailService } from "../../services/email/emailService";

describe("[UNIT] [ACTION]: Create [SERVICE]: Authentication/Authorization", () => {
  const registerMutation = (email, password) => `
        mutation {
            register(email: "${email}", password: "${password}") {
                id
            }
        }
    `;

  const loginMutation = (email, password) => `
        mutation login {
            login(email: "${email}", password: "${password}") {
                id
                email
            }
        }
    `;

  const meQuery = () => `
        query me {
            me {
                id
                email
            }
        }
    `;

  // const REGISTER_USER = gql`
  //     mutation register($email: String!, $password: String!) {
  //         register(email: $email, password: $password) {
  //             id
  //         }
  //     }
  // `;
  // const LOGIN_USER = gql`
  //     mutation login($email: String!, $password: String!) {
  //         login(email: $email, password: $password) {
  //             id
  //             email
  //         }
  //     }
  // `;

  // const USER_PROFILE = gql`
  //     query me {
  //         me {
  //             id
  //             email
  //         }
  //     }
  // `;

  let expressServer, apolloServer, typeORMConnection, environment, url;

  const testEmail = "test@test.com";
  const testPassword = "password";

  beforeEach(async () => {
    const app = await startApplication();

    expressServer = app.expressServer;
    apolloServer = app.apolloServer;
    typeORMConnection = app.typeORMConnection;
    environment = app.environment;
    url = `${environment.host}:${environment.port}${environment.graphqlPath}`;
  });

  afterEach(async () => {
    expressServer.close();
    await typeORMConnection.close();
  });

  test("can create a valid jwt for a new user", async () => {
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

    const token = await jwt.sign({ id }, SECRET, { expiresIn: "1m" });

    jwt.verify(token, SECRET, async (err, decoded) => {
      expect(!err).toBe(true);
      expect(decoded.id).toBe(id);
    });
  });

  test("login will throw error when email not found", async () => {
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

  test("login will throw error when not confirmed", async () => {
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

  test("can get logged in user", async () => {
    const axiosInstance = axios.create({ baseURL: url });

    // create user
    const registerResult = await request(
      url,
      registerMutation(testEmail, testPassword)
    );

    expect(registerResult.register).toBeTruthy();

    // create confirmation token
    const token = await jwt.sign(
      {
        id: registerResult.register.id
      },
      SECRET,
      {
        expiresIn: "5m"
      }
    );

    // create confirmation url link
    const link = emailService.createConfirmationLink(
      `${environment.host}:${environment.port}`,
      token
    );

    // confirm user
    const confirmResult = await axiosInstance.get(link);

    // TODO: move this message to a const
    expect(confirmResult.data).toBe("user has been confirmed");

    // login
    const loginResult = await axiosInstance.post(
      url,
      {
        query: loginMutation(testEmail, testPassword)
      },
      {
        withCredentials: true
      }
    );
    // console.log(loginResult);
    expect(loginResult.data).toBeTruthy();
    expect(loginResult.data.data.login).toEqual({
      email: testEmail,
      id: registerResult.register.id
    });

    // withCredentials only works from the frontend so we need to do this
    const cookie = loginResult.headers["set-cookie"][0];

    axiosInstance.defaults.headers.Cookie = cookie;

    // query profile
    const meResult = await axiosInstance.post(
      url,
      {
        query: meQuery()
      },
      {
        withCredentials: true
      }
    );

    expect(meResult.data.data).toEqual({
      me: {
        email: testEmail,
        id: registerResult.register.id
      }
    });
  });
});
