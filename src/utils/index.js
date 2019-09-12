import jwt from 'jsonwebtoken';

export const createJWT = async (data, secret, options) => await jwt.sign(data, secret, options);
