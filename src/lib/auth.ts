import { getMongoDb } from "@/lib/mongodb";
import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid email profile",
          prompt: "select_account",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/get-started",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        try {
          const db = await getMongoDb();
          const usersCollection = db.collection("users");

          const email = profile?.email;
          if (!email) {
            throw new Error("Email not found in profile");
          }

          const userData = {
            email: email,
            name: profile?.name,
            image: (profile as any)?.picture, 
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            lastLogin: new Date(),
          };

          const result = await usersCollection.findOneAndUpdate(
            { email: email },
            { $set: userData, $setOnInsert: { createdAt: new Date() } },
            { upsert: true, returnDocument: "after" }
          );

          if (result?._id) {
            token.userId = result._id.toString();
          } 
        } catch (error) {
          throw error;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};
