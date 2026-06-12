import type { Metadata } from 'next';
import {
  Bricolage_Grotesque,
  Hanken_Grotesk,
  Instrument_Serif,
} from 'next/font/google';
import Script from 'next/script';
import React from 'react';
import './globals.css';

// Body / UI typeface.
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

// Display / headline typeface (optical-size axis for crisp large type).
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// Editorial accent (italic) typeface.
const instrument = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Northwestern MMM & MPD² Starter',
  description: 'Northwestern MMM & MPD2 Next.js starter template',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${hanken.variable} ${bricolage.variable} ${instrument.variable}`}
    >
      <body className="font-sans" suppressHydrationWarning={true}>
        {/*
          Applies the saved theme before paint (see public/theme-init.js) to
          prevent a flash of the wrong theme. `next/script` with
          `beforeInteractive` hoists this into the document head and runs it
          before hydration — and avoids React 19's warning about rendering a
          raw `<script src>` inside a component.
        */}
        <Script src="/theme-init.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
