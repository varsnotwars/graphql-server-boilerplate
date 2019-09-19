import bcrypt from "bcryptjs";
import { getConnection } from "typeorm";

import {
  InvalidLoginError,
  UnconfirmedUserError
} from "../validation/graphqlErrors";
import { UserSession } from "../entity/UserSession";
import { Session } from "../entity/Session";
import { User } from "../entity/User";

export const Query = {};
export const Mutation = {
  login: async (parent, { email, password }, { req }, info) => {
    const { session, sessionID } = req;
    const conn = getConnection("default");

    const user = await conn
      .createQueryBuilder()
      .select("user")
      .from(User, "user")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) {
      throw new InvalidLoginError();
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      throw new InvalidLoginError();
    }

    if (!user.confirmed) {
      throw new UnconfirmedUserError();
    }

    // this will add user id to session cookie in db
    // store takes care of not creating dupe sessions for same sessionID
    session.userId = user.id;

    const existingSession = await conn
      .createQueryBuilder()
      .select("session")
      .from(Session, "session")
      .where("session_id = :session_id", { session_id: sessionID })
      .getOne();

    // we need to manage not creating dupes for same client
    if (!existingSession) {
      // this is how we track all session for a single user
      const insertResult = await conn
        .createQueryBuilder()
        .insert()
        .into(UserSession)
        .values([{ session_id: sessionID, user_id: user.id }])
        .execute();
    }

    return user;
  },
  logout: async (parent, { fromAll }, { req }, info) => {
    const { session, sessionID } = req;
    const conn = getConnection("default");

    return new Promise(async (resolve, reject) => {
      if (fromAll) {
        const currentUserSession = await conn
          .createQueryBuilder()
          .select("user_session")
          .from(UserSession, "user_session")
          .where("session_id = :session_id", { session_id: sessionID })
          .getOne();

        const { user_id } = currentUserSession;

        const allUserSessions = await conn
          .createQueryBuilder()
          .select("user_session")
          .from(UserSession, "user_session")
          .where("user_id = :user_id", { user_id })
          .getMany();

        const deleteResult = await conn
          .createQueryBuilder()
          .delete()
          .from(Session)
          .where("session_id in (:...sessionIds)", {
            sessionIds: allUserSessions.map(us => us.session_id)
          })
          .execute();

        // TODO: setup cascade to do this query
        const delRes = await conn
          .createQueryBuilder()
          .delete()
          .from(UserSession)
          .where("id in (:...ids)", {
            ids: allUserSessions.map(us => us.id)
          })
          .execute();

        resolve(true);
      } else {
        session.destroy(async err => {
          if (err) {
            reject(err);
          } else {
            const userSession = await conn
              .createQueryBuilder()
              .delete()
              .from(UserSession)
              .where("session_id = :session_id", { session_id: sessionID })
              .execute();

            resolve(true);
          }
        });
      }
    });
  }
};
