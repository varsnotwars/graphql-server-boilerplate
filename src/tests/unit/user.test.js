import jwt from "jsonwebtoken";

import axios from "axios";
axios.defaults.withCredentials = true;

import { request } from "graphql-request";

import { SECRET, startApplication } from "../../server";
import {
  unconfirmedUser,
  mustBeLoggedIn,
  invalidEmail,
  invalidLogin
} from "../../validation/errorMessages";
import { emailService } from "../../services/email/emailService";

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

    const token = await jwt.sign({ id }, SECRET, { expiresIn: "1m" });

    jwt.verify(token, SECRET, async (err, decoded) => {
      expect(err).toBeFalsy();
      expect(decoded.id).toBe(id);
    });
  });

  test("login will throw error when email not found", async () => {
    const axiosInstance = axios.create({ baseURL: url });

    const result = await axiosInstance.post(
      url,
      {
        query: loginMutation(testEmail, testPassword)
      },
      {
        withCredentials: true
      }
    );

    expect(result.data.errors).toBeTruthy();
    expect(
      result.data.errors.some(e => e.message === invalidLogin)
    ).toBeTruthy();
  });

  test("login will throw error when not confirmed", async () => {
    const axiosInstance = axios.create({ baseURL: url });
    const registerResult = await request(
      url,
      registerMutation(testEmail, testPassword)
    );

    expect(registerResult.register).toBeTruthy();

    const loginResult = await axiosInstance.post(
      url,
      {
        query: loginMutation(testEmail, testPassword)
      },
      {
        withCredentials: true
      }
    );

    expect(loginResult.data.errors).toBeTruthy();
    expect(
      loginResult.data.errors.some(e => e.message === unconfirmedUser)
    ).toBeTruthy();
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

  test("can logout user", async () => {
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

    // log user out
    const logoutResult = await axiosInstance.post(
      url,
      {
        query: logoutMutation()
      },
      {
        withCredentials: true
      }
    );

    expect(logoutResult.data.data.logout).toBe(true);

    const meLoggedOutResult = await axiosInstance.post(
      url,
      {
        query: meQuery()
      },
      {
        withCredentials: true
      }
    );

    expect(meLoggedOutResult.data.errors).toBeTruthy();
    expect(
      meLoggedOutResult.data.errors.some(e => e.message === mustBeLoggedIn)
    ).toBeTruthy();
  });

  test("login throws error for incorrect password", async () => {
    const axiosInstance = axios.create({ baseURL: url });

    // create user
    const registerResult = await request(
      url,
      registerMutation(testEmail, testPassword)
    );

    expect(registerResult.register).toBeTruthy();

    const loginResult = await axiosInstance.post(url, {
      query: loginMutation(testEmail, "NotTHeRightPassword")
    });

    expect(loginResult.data.errors).toBeTruthy();
    expect(
      loginResult.data.errors.some(e => e.message === invalidLogin)
    ).toBeTruthy();
  });

  test("cannot query me while unauthenticated", async () => {
    const result = await axios.post(
      url,
      {
        query: meQuery()
      },
      {
        withCredentials: true
      }
    );

    expect(result.data.errors).toBeTruthy();
    expect(
      result.data.errors.some(e => e.message === mustBeLoggedIn)
    ).toBeTruthy();
  });
});
