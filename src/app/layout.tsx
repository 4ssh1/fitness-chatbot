import type { Metadata } from "next";
import { Dela_Gothic_One, DM_Sans } from "next/font/google";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; // adjust path
import "./globals.css";
import Provider from "./SessionProvider";
import { getServerSession } from "next-auth";


const delaGothicOne = Dela_Gothic_One({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dela-gothic-one",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "GbeBody Chatbot",
  description:
    "Get tailored workouts, meal plans, and fitness tips designed for Nigerians. Whether at home or in the gym, FitNaijaGPT guides you with friendly, motivational advice, local food alternatives, and practical exercise tips, customized for your gender and goals. Stay disciplined, have fun, and crush your fitness journey",
  icons: {
    icon: "/favicon.png",
  },
};

export default async function RootLayout({ children }: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body className={`${delaGothicOne.variable} ${dmSans.variable} antialiased`}>
        <Provider session={session}>{children}</Provider>
      </body>
    </html>
  );
}
