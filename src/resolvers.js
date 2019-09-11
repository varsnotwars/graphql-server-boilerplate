import bcrypt from 'bcryptjs';
import { User } from './entity/User';

export const resolvers = {
    Query: {
        hello: (_, { name }) => `Hello ${name || 'World'}`
    },
    Mutation: {
        register: async (parent, { email, password }, context, info) => {
            const existingUser = await User.findOne({
                where: { email },
                select: ['id']
            });
        
            // manually check like this, so we can add registration by phone number late, where email could be null
            if (existingUser) {
                throw new Error('email already registered');
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
