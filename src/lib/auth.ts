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
    // Called whenever a JWT is created or updated
    async jwt({ token, account, profile }) {
      // On initial sign-in, account and profile are available
      if (account && profile) {
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

        token.userId = result?.value?._id.toString();
      }
      return token;
    },

    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET!,
};
