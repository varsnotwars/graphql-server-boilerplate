import bcrypt from 'bcryptjs';
import { User } from './entity/User';

export const resolvers = {
    Query: {
        hello: (_, { name }) => `Hello ${name || 'World'}`
    },
    Mutation: {
        register: async (parent, { email, password }, context, info) => {
            const hashedPassword = await bcrypt.hash(password, 10);

            const userModel = User.create({
                email: email,
                password: hashedPassword
            });

            await userModel.save();

            return true;
        }
    }
};
