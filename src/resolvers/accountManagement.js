import jwt from "jsonwebtoken";
import { getConnection } from "typeorm";
import { TokenError } from "../errors/graphqlErrors";
import { userCreationSchema } from "../validation/userCreationSchema";
import { createFromYupError } from "../utils/createFromYupError";
import { emailService } from "../services/emailService";
import { User } from "../entity/User";

export const Query = {};
export const Mutation = {
  resetPassword: async (parent, args, { SECRET }) => {
    let decoded;
    const { newPassword, token } = args;

    try {
      decoded = jwt.verify(token, SECRET);
    } catch (error) {
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
  forgotPassword: async (parent, { email }, { SECRET, origin }) => {
    const token = jwt.sign({ email }, SECRET, {
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
  },
  verifyToken: async (parent, { token }, { SECRET }) => {
    try {
      jwt.verify(token, SECRET);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  confirmAccount: async (parent, { token }, { SECRET }) => {
    try {
      const { id } = jwt.verify(token, SECRET);

      const user = await User.findOne({
        where: { id },
        select: ["id", "confirmed"]
      });

      if (user) {
        if (user.confirmed) {
          console.log("already confirmed");
          return true;
        }
        const conn = getConnection("default");

        await conn
          .createQueryBuilder()
          .update(User)
          .set({ confirmed: true })
          .where("id = :id", { id })
          .execute();

        return true;
      } else {
        console.log("user not found");
        return false;
      }
    } catch (error) {
      console.log(error);
      return false;
    }
  }
};
