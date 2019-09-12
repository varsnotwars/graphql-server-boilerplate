import bcrypt from 'bcryptjs';
import { User } from './entity/User';
import { UserInputError } from 'apollo-server-express';
import { emailAlreadyRegistered, invalidEmail } from './validation/errorMessages';
import { userCreationSchema } from './validation/validationSchemas';
import { createFromYupError } from './validation/formatters';
import { createJWT } from './utils';


export const resolvers = {
    Query: {
        hello: (_, { name }) => `Hello ${name || 'World'}`
    },
    Mutation: {
        register: async (parent, args, { SECRET }, info) => {

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


            // manually check like this, instead of adding the constraint at the db level
            // so we can add registration by phone number later, where email could be null
            if (existingUser) {
                throw new UserInputError(emailAlreadyRegistered);
            }

            const hashedPassword = await bcrypt.hash(args.password, 10);

            const userModel = User.create({
                email: args.email,
                password: hashedPassword
            });

            const newUser = await userModel.save();

            const token = await createJWT({ id: newUser.id }, SECRET, { expiresIn: '1d' });
            console.log(token);
            // send email logic goes here

            return newUser;
        }
    }
};
