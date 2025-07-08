import { ThemeProvider } from '@/src/context/theme';

export default function FamilyManagerLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
} 