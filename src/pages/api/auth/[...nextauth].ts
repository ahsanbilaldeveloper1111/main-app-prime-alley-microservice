import NextAuth from 'next-auth';
import { authOptions } from './authOptions';

export { authOptions };
export default NextAuth(authOptions);
