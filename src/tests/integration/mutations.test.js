import jwt from "jsonwebtoken";
import {
  emailAlreadyRegistered,
  invalidEmail,
  passwordTooShort
} from "../../errors/errorMessages";
import { startApplication, SECRET } from "../../server";
import { TestClient } from "../TestClient";
import { emailService } from "../../services/emailService";

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

  test("can reset password", async () => {
    const client = new TestClient(url);

    const result = await client.register(testEmail, testPassword);
    expect(result.data.register).toBeTruthy();

    const { id } = result.data.register;
    const { email } = result.data.register;

    const resetToken = await jwt.sign({ email }, SECRET, {
      expiresIn: "2m"
    });

    const decoded = jwt.verify(resetToken, SECRET);
    expect(decoded.email).toEqual(email);

    const newPassword = "new_password";
    const resetResult = await client.resetPassword(resetToken, newPassword);
    expect(resetResult.data.resetPassword).toBeTruthy();
    expect(resetResult.data.resetPassword).toBe(true);

    const token = await jwt.sign({ id }, SECRET, { expiresIn: "5m" });
    const link = emailService.createConfirmationLink(
      `${environment.host}:${environment.port}`,
      token
    );
    const confirmResult = await client.httpGet(link);
    expect(confirmResult).toBe(true);

    const loginResult = await client.login(testEmail, newPassword);
    expect(loginResult.data.login).toEqual({ id, email });
  });
});
