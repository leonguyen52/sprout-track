import { ThemeProvider } from '@/src/context/theme';

export default function FamilySelectLayout({
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