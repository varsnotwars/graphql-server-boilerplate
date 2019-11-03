import { getConnection } from "typeorm";
import jwt from "jsonwebtoken";

import { EmailAlreadyRegisteredError } from "../errors/graphqlErrors";
import { userCreationSchema } from "../validation/userCreationSchema";
import { User } from "../entity/User";
import { createFromYupError } from "../utils/createFromYupError";
import { emailService } from "../services/emailService";
import { isAuthenticated } from "../middleware/isAuthenticated";
import { tokenService } from "../services/tokenService";

export const Query = {
  profile: isAuthenticated.createResolver(async (parent, args, { req }) => {
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
};
export const Mutation = {
  register: async (parent, args, { SECRET, origin }) => {
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
      const token = tokenService.createConfirmAccountToken({ id: newUser.id });

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
  }
};
