import bcrypt from 'bcryptjs';
import { User } from './entity/User';
import { UserInputError } from 'apollo-server-express';
import { emailAlreadyRegistered, invalidEmail } from './validation/errorMessages';
import { userCreationSchema } from './validation/validationSchemas';
import { createFromYupError } from './validation/formatters';


export const resolvers = {
    Query: {
        hello: (_, { name }) => `Hello ${name || 'World'}`
    },
    Mutation: {
        register: async (parent, args, context, info) => {

            try {
                // abort early, cleaner to throw one error object instead of trying to parse and throw many errors
                await userCreationSchema.validate(args, { abortEarly: true });
            } catch (error) {
                throw createFromYupError(error);
            }


            const existingUser = await User.findOne({
                where: { email: args.email },
                select: ['id']
            });


            // manually check like this, so we can add registration by phone number late, where email could be null
            if (existingUser) {
                throw new UserInputError(emailAlreadyRegistered);
            }

            const hashedPassword = await bcrypt.hash(args.password, 10);

            const userModel = User.create({
                email: args.email,
                password: hashedPassword
            });

            const newUser = await userModel.save();

            return newUser;
        }
    }
};
