import GoogleProvider from "next-auth/providers/google";

import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                await dbConnect();
                const user = await User.findOne({ email: credentials.email });

                if (user && user.password === credentials.password) {
                    return {
                        id: user._id.toString(),
                        name: user.name,
                        email: user.email,
                        isAdmin: user.isAdmin,
                    };
                }
                return null;
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            if (account.provider === "google") {
                try {
                    await dbConnect();
                    const existingUser = await User.findOne({ email: user.email });
                    if (!existingUser) {
                        await User.create({
                            name: user.name,
                            email: user.email,
                            image: user.image,
                            isAdmin: user.email === 'sarkartanish2802@gmail.com',
                        });
                    } else if (!existingUser.image && user.image) {
                        existingUser.image = user.image;
                        await existingUser.save();
                    }
                } catch (err) {
                    console.error("Sign-in DB Error:", err);
                    // Non-blocking: allow sign-in to proceed even if DB sync fails
                }
            }
            return true;
        },
        async jwt({ token, user, account, trigger, session }) {
            if (user) {
                token.id = user.id;
                token.isAdmin = user.isAdmin;
            }
            if (trigger === "update" && session?.name) {
                token.name = session.name;
            }

            // Always fetch latest permissions/books from DB to ensure session is up to date
            // (Optimize: this hits DB on every JWT rotation, but it's safer for purchase syncing)
            if (token.email) {
                await dbConnect();
                const dbUser = await User.findOne({ email: token.email });
                if (dbUser) {
                    token.purchasedBooks = dbUser.purchasedBooks;
                    token.isAdmin = dbUser.isAdmin; // Sync admin status too
                }
            }

            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id;
                session.user.isAdmin = token.isAdmin;
                session.user.purchasedBooks = token.purchasedBooks || [];
            }
            return session;
        },
    },
    pages: {
        signIn: "/signin",
    },
    secret: process.env.NEXTAUTH_SECRET,
};
