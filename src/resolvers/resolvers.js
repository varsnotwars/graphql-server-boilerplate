import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getConnection } from "typeorm";
import { emailService } from "../services/email/emailService";
import { userCreationSchema } from "../validation/validationSchemas";
import { createFromYupError } from "../validation/formatters";
import { User } from "../entity/User";
import { Session } from "../entity/Session";
import { isAuthenticated } from "./accessControl";
import {
  InvalidLoginError,
  UnconfirmedUserError,
  EmailAlreadyRegisteredError,
  TokenError
} from "../validation/graphqlErrors";
import { UserSession } from "../entity/UserSession";

export const resolvers = {
  Query: {
    me: isAuthenticated.createResolver(async (parent, args, { req }, info) => {
      const conn = getConnection("default");
      const { session } = req;

      const user = await conn
        .createQueryBuilder()
        .select("user")
        .from(User, "user")
        .where("user.id = :id", { id: session.userId })
        .getOne();

      return user;
    })
  },
  Mutation: {
    register: async (parent, args, { SECRET, origin }, info) => {
      try {
        // abort early, cleaner to throw one error object instead of trying to parse and throw many errors
        await userCreationSchema.validate(args, { abortEarly: true });
      } catch (error) {
        throw createFromYupError(error);
      }
      const { email, password } = args;
      const existingUser = await User.findOne({
        where: { email },
        select: ["id"]
      });

      // manually check like this, instead of adding the constraint at the db level
      // so we can add registration by phone number later, where email could be null
      if (existingUser) {
        throw new EmailAlreadyRegisteredError();
      }

      const userModel = User.create({
        email,
        password
      });

      // save using model, not QB, to trigger hooks
      const newUser = await userModel.save();

      if (process.env.NODE_ENV !== "test") {
        const token = await jwt.sign({ id: newUser.id }, SECRET, {
          expiresIn: "1d"
        });

        const url = emailService.createConfirmationLink(origin, token);
        const html = emailService.createConfirmEmail(url);

        emailService.sendEmail(
          newUser.email,
          process.env.GMAIL_USER,
          "Confirm your email",
          html
        );
      }

      return newUser;
    },
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
    },
    resetPassword: async (parent, args, { SECRET }, info) => {
      let decoded;
      const { newPassword, token } = args;

      try {
        decoded = jwt.verify(token, SECRET);
      } catch (error) {
        console.error(error);
        throw new TokenError("token not valid");
      }

      const { email } = decoded;

      try {
        await userCreationSchema.validate(
          { email: email, password: newPassword },
          { abortEarly: true }
        );
      } catch (error) {
        throw createFromYupError(error);
      }

      const user = await getConnection("default")
        .createQueryBuilder()
        .select("user")
        .from(User, "user")
        .where("user.email = :email", { email })
        .getOne();

      if (!user) {
        console.error(new Error("user not found"));
        return false;
      }

      user.password = newPassword;

      // update like this to trigger hook
      await user.save();

      return true;
    },
    verifyToken: async (parent, { token }, { SECRET }, info) => {
      try {
        jwt.verify(token, SECRET);
        return true;
      } catch (error) {
        console.error(error);
        return false;
      }
    },
    forgotPassword: async (parent, { email }, { SECRET, origin }, info) => {
      const token = await jwt.sign({ email }, SECRET, {
        expiresIn: "20m"
      });

      const url = emailService.createResetPasswordLink(origin, token);
      const html = emailService.createResetPasswordEmail(url);

      emailService.sendEmail(
        email,
        process.env.GMAIL_USER,
        "Reset your password",
        html
      );

      return true;
    }
  }
};
