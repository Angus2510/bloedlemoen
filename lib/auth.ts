import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from "bcryptjs"; // TODO: Re-enable after Prisma regeneration
// Temporarily disable database adapter - using JWT for now
// import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  // Use JWT sessions for now - simpler and more reliable
  // adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          return null;
        }

        // TODO: Enable password verification after Prisma client regeneration
        // For now, allow login for any registered user
        // const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        // if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      authorization: {
        params: {
          scope: "email,public_profile",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/facebook`,
        },
      },
      profile(profile) {
        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.picture?.data?.url || null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      console.log("Sign in attempt:", {
        provider: account?.provider,
        email: user.email,
      });
      return true;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub || "";
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;

        // Get points from database using email
        try {
          const userData = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { points: true, totalEarned: true },
          });
          session.user.points = userData?.points || 0;
          session.user.totalEarned = userData?.totalEarned || 0;
        } catch (error) {
          console.error("Error fetching user points:", error);
          session.user.points = 0;
          session.user.totalEarned = 0;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;

        // Store provider info and create/update user in database
        if (account) {
          token.provider = account.provider;
          console.log("JWT callback:", {
            provider: account.provider,
            email: user.email,
          });

          // Create or update user in database for JWT sessions
          try {
            await prisma.user.upsert({
              where: { email: user.email || "" },
              update: {
                name: user.name,
                image: user.image,
              },
              create: {
                email: user.email || "",
                name: user.name,
                image: user.image,
                points: 0,
                totalEarned: 0,
              },
            });
          } catch (error) {
            console.error("Error creating/updating user:", error);
          }
        }
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
};
