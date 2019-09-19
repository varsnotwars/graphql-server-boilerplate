import jwt from "jsonwebtoken";

import { SECRET, startApplication } from "../../server";
import {
  unconfirmedUser,
  mustBeLoggedIn,
  invalidLogin
} from "../../errors/errorMessages";
import { emailService } from "../../services/emailService";
import { TestClient } from "../TestClient";

describe("[UNIT] [ENTITY]: User [LOGIC]: Authentication/Authorization", () => {
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
    const client = new TestClient(url);
    const result = await client.register(testEmail, testPassword);

    expect(result.data.register).toBeTruthy();

    const { id } = result.data.register;

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

  test("can logout user from single session", async () => {
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

    const logoutResult = await client.logout(false);
    expect(logoutResult.data.logout).toBe(true);

    const meLoggedOutResult = await client.me();
    expect(meLoggedOutResult.errors).toBeTruthy();
    expect(
      meLoggedOutResult.errors.some(e => e.message === mustBeLoggedIn)
    ).toBeTruthy();
  });

  test("can logout user from all sessions", async () => {
    const session1 = new TestClient(url);
    const session2 = new TestClient(url);

    const result = await session1.register(testEmail, testPassword);
    expect(result.data.register).toBeTruthy();

    const { id } = result.data.register;
    const token = await jwt.sign({ id }, SECRET, { expiresIn: "5m" });
    const link = emailService.createConfirmationLink(
      `${environment.host}:${environment.port}`,
      token
    );
    const confirmResult = await session1.httpGet(link);
    expect(confirmResult).toBe("user has been confirmed");

    await session1.login(testEmail, testPassword);
    await session2.login(testEmail, testPassword);

    await session1.logout(true);

    const me1 = await session1.me();
    const me2 = await session2.me();

    expect(me1.errors.some(e => e.message == mustBeLoggedIn)).toEqual(
      me2.errors.some(e => e.message == mustBeLoggedIn)
    );
  });

  test("login throws error for incorrect password", async () => {
    const client = new TestClient(url);

    // create user
    const registerResult = await client.register(testEmail, testPassword);

    expect(registerResult.data.register).toBeTruthy();

    const loginResult = await client.login(testEmail, "NotTHeRightPassword");

    expect(loginResult.errors).toBeTruthy();
    expect(
      loginResult.errors.some(e => e.message === invalidLogin)
    ).toBeTruthy();
  });

  test("cannot query me while unauthenticated", async () => {
    const client = new TestClient(url);
    const result = await client.me();

    expect(result.errors).toBeTruthy();
    expect(result.errors.some(e => e.message === mustBeLoggedIn)).toBeTruthy();
  });
});
