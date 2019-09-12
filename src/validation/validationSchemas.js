import * as yup from 'yup';
import { passwordTooShort, invalidEmail } from './errorMessages';

// use const error messages we define so we can test against them, don't depend on yups' errors
export const userCreationSchema = yup.object().shape({
    email: yup
        .string()
        .min(6)
        .max(255)
        .email(invalidEmail),
    password: yup
        .string()
        .min(8, passwordTooShort)
        .max(255)
});