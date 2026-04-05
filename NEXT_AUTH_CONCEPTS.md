# Key Concepts of NextAuth.js

This document provides a high-level overview of the key concepts involved in setting up authentication with NextAuth.js in a Next.js application.

## 1. What is NextAuth.js?

NextAuth.js is a complete open-source authentication solution for Next.js applications. It is designed to be easy to use and flexible, supporting a wide range of authentication providers and database adapters.

## 2. Core Components

### a. API Route (`/api/auth/[...nextauth]/route.ts`)

This is the heart of the NextAuth.js setup. It's a "catch-all" API route that handles all authentication-related requests, such as:

-   Signing in (`/api/auth/signin`)
-   Signing out (`/api/auth/signout`)
-   Getting session data (`/api/auth/session`)
-   Handling callbacks from OAuth providers (`/api/auth/callback/[provider]`)

You configure all your authentication options within this file, including providers, adapters, and session strategies.

### b. Providers

Providers are services that can be used to authenticate users. NextAuth.js supports a wide variety of built-in providers, including:

-   **OAuth Providers**: Google, Facebook, GitHub, Twitter, etc. These are used for social sign-on.
-   **Email Provider**: For passwordless authentication using "magic links".
-   **Credentials Provider**: For traditional username/password authentication.

In this project, we are using `GoogleProvider` and `FacebookProvider`.

### c. Adapters

Adapters are used to connect NextAuth.js to a database to persist user and session data. This is crucial for session management and for storing user information from OAuth providers.

We are using the `@next-auth/mongodb-adapter` to connect to a MongoDB database. When a user signs in for the first time with an OAuth provider, the adapter will automatically create a new user in your database with the information provided by the provider (name, email, image).

### d. Session Management

NextAuth.js offers two main session strategies:

-   **JWT (JSON Web Tokens)**: This is the default strategy. Session data is stored in a stateless, self-contained JWT that is passed between the client and server. This is fast and doesn't require a database lookup for every request.
-   **Database**: Session data is stored in the database. This is more secure for sensitive applications and allows for more complex session management, such as tracking active sessions.

We are using the `jwt` strategy in this project, but the session information is still linked to the user in the database via the adapter.

## 3. Client-Side vs. Server-Side

### a. Client-Side (`'use client'`)

On the client-side, NextAuth.js provides the `next-auth/react` library with helpful hooks and functions:

-   **`SessionProvider`**: A context provider that you wrap your application with (usually in `layout.tsx`) to make session data available globally.
-   **`useSession()`**: A React hook to access the session data (e.g., `const { data: session, status } = useSession()`). The `status` can be `loading`, `authenticated`, or `unauthenticated`.
-   **`signIn()`**: A function to initiate the sign-in process.
-   **`signOut()`**: A function to sign the user out.

### b. Server-Side (Server Components & API Routes)

On the server-side, you can access the session using:

-   **`getServerSession(authOptions)`**: A function to get the session object in Server Components, API routes, or `getServerSideProps`. This is the recommended way to securely access session data on the server.

## 4. Callbacks

Callbacks are functions that allow you to customize the behavior of NextAuth.js at different points in the authentication flow. Some common callbacks include:

-   **`signIn`**: Called when a user tries to sign in. You can use this to add custom logic, like checking if a user is allowed to sign in.
-   **`jwt`**: Called whenever a JWT is created or updated. You can use this to add custom data to the token.
-   **`session`**: Called whenever a session is checked. You can use this to add custom data to the session object that is returned to the client.

In our setup, we use the `session` callback to add the user's ID to the session object.
