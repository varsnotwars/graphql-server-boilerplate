import {
  emailAlreadyRegistered,
  invalidEmail,
  passwordTooShort
} from "../../validation/errorMessages";
import { startApplication } from "../../server";
import { TestClient } from "../TestClient";

describe("[UNIT] [ACTION]: Register [ENTITY]: User", () => {
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

  test("can register user", async () => {
    const client = new TestClient(url);

    const result = await client.register(testEmail, testPassword);
    expect(result.data.register).toBeTruthy();

    const { email } = result.data.register;
    expect(email).toEqual(testEmail);
  });

  test("cannot register same email twice", async () => {
    const client = new TestClient(url);

    const result1 = await client.register(testEmail, testPassword);
    expect(result1.data.register).toBeTruthy();
    const result2 = await client.register(testEmail, testPassword);

    expect(result2.errors).toBeTruthy();
    expect(
      result2.errors.some(e => e.message === emailAlreadyRegistered)
    ).toBeTruthy();
  });

  test("cannot register invalid email", async () => {
    const client = new TestClient(url);

    const result = await client.register("InvalidEmail", testPassword);

    expect(result.errors).toBeTruthy();
    expect(result.errors.some(e => e.message === invalidEmail)).toBeTruthy();
  });

  test("cannot register invalid password", async () => {
    const client = new TestClient(url);

    const result = await client.register(testEmail, "abc");

    expect(result.errors).toBeTruthy();
    expect(
      result.errors.some(e => e.message === passwordTooShort)
    ).toBeTruthy();
  });
});
