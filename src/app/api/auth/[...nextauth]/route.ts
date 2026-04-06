import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions } from "next-auth";
import { getMongoDb } from "@/lib/mongodb";

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
    strategy: "jwt", // keep JWT strategy
  },
  pages: {
    signIn: "/get-started",
  },
  callbacks: {
    // Called whenever a JWT is created or updated
    async jwt({ token, account, profile }) {
      // On initial sign-in, account and profile are available
      if (account && profile) {
        const db = await getMongoDb();
        const usersCollection = db.collection("users");

        const userData = {
          email: profile.email!,
          name: profile.name,
          image: profile.image,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          lastLogin: new Date(),
          createdAt: new Date(),
        };

        const result = await usersCollection.findOneAndUpdate(
          { email: profile.email },
          { $set: userData, $setOnInsert: { createdAt: new Date() } },
          { upsert: true, returnDocument: "after" }
        );

        // Store our internal user ID in the token
        token.userId = result?.value?._id.toString();
      }
      return token;
    },

    // Add user ID to the session object
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };