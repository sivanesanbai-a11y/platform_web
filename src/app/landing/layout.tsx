import type { Metadata } from 'next';
import './landing.css';

export const metadata: Metadata = {
  title: 'Studio — Footer',
  description: 'Fresh ideas, imagination, and creative collaboration.',
  icons: { icon: '/logo.svg' },
};

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
