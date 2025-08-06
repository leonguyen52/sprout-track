import { ThemeProvider } from '@/src/context/theme';
import { DeploymentProvider } from '@/app/context/deployment';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider>
      <DeploymentProvider>
        {children}
      </DeploymentProvider>
    </ThemeProvider>
  );
}
