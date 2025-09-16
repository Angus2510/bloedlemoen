import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
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

        try {
          // Find user in database
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          if (!user) {
            // For demo purposes, create a new user if not found
            // In production, you might want to handle this differently
            const newUser = await prisma.user.create({
              data: {
                email: credentials.email,
                name: credentials.email.split("@")[0],
                // Note: In production, you'd hash and store the password
                // const hashedPassword = await bcrypt.hash(credentials.password, 12);
              },
            });
            return {
              id: newUser.id,
              email: newUser.email,
              name: newUser.name,
              image: newUser.image,
            };
          }

          // In a real app, you'd verify the password here
          // const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          // For demo purposes, we'll accept any password
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
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
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        // Get user's current points from database
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { points: true, totalEarned: true },
        });
        session.user.points = dbUser?.points || 0;
        session.user.totalEarned = dbUser?.totalEarned || 0;
      }
      return session;
    },
  },
  session: {
    strategy: "database",
  },
};
