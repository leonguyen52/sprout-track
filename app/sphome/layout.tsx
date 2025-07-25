import { ThemeProvider } from '@/src/context/theme';

export default function SaaSLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
