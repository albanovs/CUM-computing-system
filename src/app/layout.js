import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from '../components/header';
import { ReduxProvider } from "../lib/providers/ReduxProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "База данных клиентов",
  description: "Created by @albvnovs",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <Header />
          <div className="lg:mt-30 mb-20 mt-20 max-w-[1440px] mx-auto">{children}</div>
        </ReduxProvider>
      </body>
    </html>
  );
}
