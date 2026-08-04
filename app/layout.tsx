import type {Metadata, Viewport} from 'next';
import { Merriweather, Source_Serif_4, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const merriweather = Merriweather({ 
  subsets: ['latin'], 
  weight: ['300', '400', '700', '900'],
  variable: '--font-merriweather' 
});

const sourceSerif = Source_Serif_4({ 
  subsets: ['latin'], 
  variable: '--font-source-serif' 
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ['latin'], 
  variable: '--font-jetbrains-mono' 
});

export const metadata: Metadata = {
  title: 'LifeStory | Your Journey, Interactive',
  description: 'An AI-powered interviewer that helps you build a beautiful, interactive timeline of your life\'s most meaningful moments.',
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#3a5a1c',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${merriweather.variable} ${sourceSerif.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme') || 'dark';
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body 
        suppressHydrationWarning 
        className="antialiased"
        style={{
          // @ts-ignore
          '--font-sans': 'var(--font-merriweather), serif',
          '--font-serif': 'var(--font-source-serif), serif',
          '--font-mono': 'var(--font-jetbrains-mono), monospace',
        }}
      >
        {children}
      </body>
    </html>
  );
}
