import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { NextAuthOptions } from 'next-auth';
export const authOptions: NextAuthOptions  = {
 providers: [
  GoogleProvider({
   clientId: process.env.GOOGLE_ID || '',
   clientSecret: process.env.GOOGLE_SECRET || '',
  }),
 ],
 session: {
  strategy: 'jwt',
 },
 secret: process.env.SECRET,
};
export default NextAuth(authOptions);