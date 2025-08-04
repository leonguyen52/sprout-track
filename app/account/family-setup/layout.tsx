import { ThemeProvider } from '@/src/context/theme';

export default function FamilySetupLayout({
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
