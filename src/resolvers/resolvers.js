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
  EmailAlreadyRegisteredError
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

      const existingUser = await User.findOne({
        where: { email: args.email },
        select: ["id"]
      });

      // manually check like this, instead of adding the constraint at the db level
      // so we can add registration by phone number later, where email could be null
      if (existingUser) {
        throw new EmailAlreadyRegisteredError();
      }

      const hashedPassword = await bcrypt.hash(args.password, 10);

      const userModel = User.create({
        email: args.email,
        password: hashedPassword
      });

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
    }
  }
};
