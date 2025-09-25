import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { ThemeProvider } from '@/src/context/theme';
import ComingSoon from './home/page';

export default async function HomePage() {
  try {
    // Determine deployment mode first
    const configRes = await fetch(`/api/deployment-config`, {
      cache: 'no-store',
    });
    const configJson = await configRes.json();
    const deploymentMode = configJson?.data?.deploymentMode || 'selfhosted';

    if (deploymentMode === 'saas') {
      // SaaS mode - render SaaS homepage directly
      return (
        <ThemeProvider>
          <ComingSoon />
        </ThemeProvider>
      );
    }

    // Self-hosted mode logic - decide redirect server-side so incognito works
    const familiesRes = await fetch(`/api/family/public-list`, { cache: 'no-store' });
    const familiesJson = await familiesRes.json();
    const familiesData = Array.isArray(familiesJson?.data) ? (familiesJson.data as { slug: string }[]) : [];

    // Prefer explicit checks on count
    if (familiesData.length > 1) {
      redirect('/family-select');
    }
    if (familiesData.length === 1) {
      redirect(`/${familiesData[0].slug}/login`);
    }

    // No families found - check caretaker status to decide setup
    const caretakerExistsRes = await fetch(`/api/auth/caretaker-exists`, { cache: 'no-store' });
    const caretakerJson = await caretakerExistsRes.json();
    const hasCaretakers = !!(caretakerJson?.success && caretakerJson.data?.exists);
    if (!hasCaretakers) {
      redirect('/login?setup=true');
    }
    // With no families but caretakers exist, send to login
    redirect('/login');
  } catch (error) {
    // On error, prefer login (safer than family-select when only one family should be available)
    redirect('/login');
  }

  // Should never render; redirects above handle all cases
  return null;
}
