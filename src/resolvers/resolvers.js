import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getConnection } from "typeorm";
import { emailService } from "../services/email/emailService";
import { userCreationSchema } from "../validation/validationSchemas";
import { createFromYupError } from "../validation/formatters";
import { User } from "../entity/User";
import { isAuthenticated } from "./accessControl";
import {
  InvalidLoginError,
  UnconfirmedUserError,
  EmailAlreadyRegisteredError
} from "../validation/graphqlErrors";

export const resolvers = {
  Query: {
    me: isAuthenticated.createResolver(
      async (parent, args, { session }, info) => {
        const conn = getConnection("default");

        const user = await conn
          .createQueryBuilder()
          .select("user")
          .from(User, "user")
          .where("user.id = :id", { id: session.userId })
          .getOne();

        return user;
      }
    )
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
    login: async (parent, { email, password }, { session }, info) => {
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

      // TODO: check password!!!!!

      if (!user.confirmed) {
        throw new UnconfirmedUserError();
      }

      session.userId = user.id;

      return user;
    },
    logout: async (parent, { email, password }, { session }, info) => {
      return new Promise((resolve, reject) => {
        session.destroy(err => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });
    }
  }
};
