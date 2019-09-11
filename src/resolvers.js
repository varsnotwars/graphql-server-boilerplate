import bcrypt from 'bcryptjs';
import { User } from './entity/User';
import { UserInputError } from 'apollo-server-express';
import { emailAlreadyRegistered, notValidEmail } from './validation/errorMessages';
import { userCreationSchema } from './validation/validationSchemas';
import { formatYupError } from './validation/formatters';


export const resolvers = {
    Query: {
        hello: (_, { name }) => `Hello ${name || 'World'}`
    },
    Mutation: {
        register: async (parent, args, context, info) => {

            try {
                await userCreationSchema.validate(args, { abortEarly: false });
            } catch (error) {
                console.log(formatYupError(error));
                throw new UserInputError(formatYupError(error));
            }


            const existingUser = await User.findOne({
                where: { email },
                select: ['id']
            });


            // manually check like this, so we can add registration by phone number late, where email could be null
            if (existingUser) {
                throw new UserInputError(emailAlreadyRegistered);
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const userModel = User.create({
                email: email,
                password: hashedPassword
            });

            const newUser = await userModel.save();

            return newUser;
        }
    }
};
