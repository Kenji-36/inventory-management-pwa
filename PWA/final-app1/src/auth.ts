import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

// NextAuth.js v5 設定
export const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    // JWTコールバック - トークンにユーザー情報を追加
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    // セッションコールバック - クライアントに公開する情報を設定
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
    // 認可コールバック - ルートへのアクセス制御
    async authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname.startsWith("/login");
      const isOnApiAuth = nextUrl.pathname.startsWith("/api/auth");

      // API認証ルートは常に許可
      if (isOnApiAuth) {
        return true;
      }

      // ログインページ
      if (isOnLoginPage) {
        if (isLoggedIn) {
          // ログイン済みならダッシュボードへリダイレクト
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // その他のページはログイン必須
      return isLoggedIn;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30日
  },
  trustHost: true,
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
