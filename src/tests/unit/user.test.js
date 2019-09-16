import jwt from "jsonwebtoken";
import { request } from "graphql-request";

import { SECRET, startApplication } from "../../server";
import {
  unconfirmedUser,
  mustBeLoggedIn,
  invalidEmail,
  invalidLogin
} from "../../validation/errorMessages";
import { emailService } from "../../services/email/emailService";
import { TestClient } from "../TestClient";

describe("[UNIT] [ENTITY]: User [LOGIC]: Authentication/Authorization", () => {
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

  const logoutMutation = () => `
    mutation logout {
        logout
    }
`;

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
    const result = await request(
      url,
      registerMutation(testEmail, testPassword)
    );

    expect(result.register).toBeTruthy();

    const { id } = result.register;

    const token = jwt.sign({ id }, SECRET, { expiresIn: "1m" });

    jwt.verify(token, SECRET, async (err, decoded) => {
      expect(err).toBeFalsy();
      expect(decoded.id).toBe(id);
    });
  });

  test("login will throw error when email not found", async () => {
    const client = new TestClient(url);

    const result = await client.login(testEmail, testPassword);

    expect(result.errors).toBeTruthy();
    expect(result.errors.some(e => e.message === invalidLogin)).toBeTruthy();
  });

  test("login will throw error when not confirmed", async () => {
    const client = new TestClient(url);
    const registerResult = await client.register(testEmail, testPassword);

    expect(registerResult.data.register).toBeTruthy();

    const loginResult = await client.login(testEmail, testPassword);

    expect(loginResult.errors).toBeTruthy();
    expect(
      loginResult.errors.some(e => e.message === unconfirmedUser)
    ).toBeTruthy();
  });

  test("can get logged in user", async () => {
    const client = new TestClient(url);

    const registerResult = await client.register(testEmail, testPassword);

    expect(registerResult.data.register).toBeTruthy();
    const { id } = registerResult.data.register;

    const token = await jwt.sign({ id }, SECRET, { expiresIn: "5m" });

    const link = emailService.createConfirmationLink(
      `${environment.host}:${environment.port}`,
      token
    );

    const confirmResult = await client.httpGet(link);

    expect(confirmResult).toBe("user has been confirmed");

    const loginResult = await client.login(testEmail, testPassword);
    expect(loginResult.data).toBeTruthy();
    expect(loginResult.data).toEqual({
      login: {
        email: testEmail,
        id: id
      }
    });

    const meResult = await client.me();
    expect(meResult.data).toEqual({
      me: {
        email: testEmail,
        id: id
      }
    });
  });

  test("can logout user", async () => {
    const client = new TestClient(url);

    const registerResult = await client.register(testEmail, testPassword);

    expect(registerResult.data.register).toBeTruthy();
    const { id } = registerResult.data.register;

    const token = await jwt.sign({ id }, SECRET, { expiresIn: "5m" });

    const link = emailService.createConfirmationLink(
      `${environment.host}:${environment.port}`,
      token
    );

    const confirmResult = await client.httpGet(link);

    expect(confirmResult).toBe("user has been confirmed");

    const loginResult = await client.login(testEmail, testPassword);
    expect(loginResult.data).toBeTruthy();
    expect(loginResult.data).toEqual({
      login: {
        email: testEmail,
        id: id
      }
    });

    const meResult = await client.me();
    expect(meResult.data).toEqual({
      me: {
        email: testEmail,
        id: id
      }
    });

    const logoutResult = await client.logout();
    expect(logoutResult.data.logout).toBe(true);

    const meLoggedOutResult = await client.me();
    expect(meLoggedOutResult.errors).toBeTruthy();
    expect(
      meLoggedOutResult.errors.some(e => e.message === mustBeLoggedIn)
    ).toBeTruthy();
  });

  test("login throws error for incorrect password", async () => {
    const client = new TestClient(url);

    // create user
    const registerResult = await client.register(testEmail, testPassword);

    expect(registerResult.data.register).toBeTruthy();

    const loginResult = await client.login(testEmail, "NotTHeRightPassword");

    expect(loginResult.errors).toBeTruthy();
    expect(
      loginResult.data.errors.some(e => e.message === invalidLogin)
    ).toBeTruthy();
  });

  test("cannot query me while unauthenticated", async () => {
    const client = new TestClient(url);
    const result = await client.me();

    expect(result.errors).toBeTruthy();
    expect(result.errors.some(e => e.message === mustBeLoggedIn)).toBeTruthy();
  });
});
