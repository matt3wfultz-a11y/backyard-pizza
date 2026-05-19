import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Backyard Pizza',
  description: 'Fresh wood-fired pizzas from the backyard brick oven. Reserve your slice of the neighborhood.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-brick-50 font-serif">
        {children}
      </body>
    </html>
  );
}
