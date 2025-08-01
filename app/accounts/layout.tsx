import { ThemeProvider } from '@/src/context/theme';

export default function AccountsLayout({
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