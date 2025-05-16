import { ThemeProvider } from '@/src/context/theme';
import { FamilyProvider } from '@/src/context/family';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <FamilyProvider>
        {children}
      </FamilyProvider>
    </ThemeProvider>
  );
}
