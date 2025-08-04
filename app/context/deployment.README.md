# Deployment Context

A React Context provider for handling deployment configuration in the Baby Tracker application. This context provides deployment mode information and site configuration to components throughout the application, enabling different behavior based on whether the app is running in SaaS or self-hosted mode.

## Features

- Automatically fetches deployment configuration from the server
- Caches configuration in memory to avoid repeated API calls
- Provides convenient boolean flags for deployment mode checks
- Handles loading states and error fallbacks
- Refreshes configuration when the window gains focus (with throttling)
- Provides debugging utilities for troubleshooting

## Usage

### Provider Setup

The DeploymentProvider should be set up in the application's root layout, typically wrapping other context providers:

```tsx
// app/layout.tsx
import { DeploymentProvider } from './context/deployment';
import { BabyProvider } from './context/baby';
import { TimezoneProvider } from './context/timezone';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <DeploymentProvider>
      <BabyProvider>
        <TimezoneProvider>
          <html lang="en">
            <body>
              {children}
            </body>
          </html>
        </TimezoneProvider>
      </BabyProvider>
    </DeploymentProvider>
  );
}
```

### Using the Context

```tsx
import { useDeployment } from '@/app/context/deployment';

function MyComponent() {
  const { 
    isLoading,
    config,
    isSaasMode,
    isSelfHosted,
    accountsEnabled,
    registrationAllowed,
    refreshConfig,
    getDeploymentInfo
  } = useDeployment();
  
  // Show loading state while configuration is being fetched
  if (isLoading) {
    return <div>Loading configuration...</div>;
  }
  
  // Conditional rendering based on deployment mode
  if (isSaasMode) {
    return (
      <div>
        <h1>SaaS Mode</h1>
        {accountsEnabled && <p>Accounts are enabled</p>}
        {registrationAllowed && <p>Registration is allowed</p>}
      </div>
    );
  }
  
  if (isSelfHosted) {
    return (
      <div>
        <h1>Self-Hosted Mode</h1>
        <p>Running in self-hosted configuration</p>
      </div>
    );
  }
  
  return <div>Unknown deployment mode</div>;
}
```

## API Reference

### Context Values

| Property | Type | Description |
|----------|------|-------------|
| `isLoading` | `boolean` | Whether the deployment context is still loading |
| `config` | `DeploymentConfig \| null` | The full deployment configuration object |
| `isSaasMode` | `boolean` | Whether the app is running in SaaS mode |
| `isSelfHosted` | `boolean` | Whether the app is running in self-hosted mode |
| `accountsEnabled` | `boolean` | Whether accounts are enabled |
| `registrationAllowed` | `boolean` | Whether account registration is allowed |
| `refreshConfig` | `() => void` | Force refresh the deployment configuration |
| `getDeploymentInfo` | `() => DeploymentInfo` | Get deployment information for debugging |

### DeploymentConfig Interface

```typescript
interface DeploymentConfig {
  deploymentMode: 'saas' | 'selfhosted';
  enableAccounts: boolean;
  allowAccountRegistration: boolean;
}
```

### `isLoading`

A boolean indicating whether the deployment context is still fetching configuration from the server.

```typescript
const { isLoading } = useDeployment();

if (isLoading) {
  return <div>Loading deployment configuration...</div>;
}
```

### `config`

The full deployment configuration object, or `null` if not yet loaded.

```typescript
const { config } = useDeployment();

if (config) {
  console.log('Deployment mode:', config.deploymentMode);
  console.log('Accounts enabled:', config.enableAccounts);
  console.log('Registration allowed:', config.allowAccountRegistration);
}
```

### `isSaasMode`

A boolean indicating whether the app is running in SaaS mode.

```typescript
const { isSaasMode } = useDeployment();

return (
  <div>
    {isSaasMode ? (
      <p>Welcome to our SaaS platform!</p>
    ) : (
      <p>Welcome to your self-hosted instance!</p>
    )}
  </div>
);
```

### `isSelfHosted`

A boolean indicating whether the app is running in self-hosted mode.

```typescript
const { isSelfHosted } = useDeployment();

return (
  <div>
    {isSelfHosted && (
      <div>
        <h2>Self-Hosted Configuration</h2>
        <p>You have full control over your data and settings.</p>
      </div>
    )}
  </div>
);
```

### `accountsEnabled`

A boolean indicating whether accounts are enabled in the current deployment.

```typescript
const { accountsEnabled } = useDeployment();

return (
  <div>
    {accountsEnabled ? (
      <button>Login to Your Account</button>
    ) : (
      <p>Account system is disabled</p>
    )}
  </div>
);
```

### `registrationAllowed`

A boolean indicating whether account registration is allowed.

```typescript
const { registrationAllowed, accountsEnabled } = useDeployment();

return (
  <div>
    {accountsEnabled && registrationAllowed && (
      <button>Create New Account</button>
    )}
  </div>
);
```

### `refreshConfig()`

Forces a refresh of the deployment configuration from the server.

```typescript
const { refreshConfig } = useDeployment();

const handleRefresh = () => {
  refreshConfig();
};

return <button onClick={handleRefresh}>Refresh Configuration</button>;
```

### `getDeploymentInfo()`

Returns debugging information about the deployment context.

```typescript
const { getDeploymentInfo } = useDeployment();

const debugInfo = getDeploymentInfo();
console.log('Deployment info:', debugInfo);
// {
//   config: { deploymentMode: 'saas', enableAccounts: true, allowAccountRegistration: true },
//   isLoading: false,
//   lastFetched: Date object
// }
```

## Environment Variables

The deployment context reads configuration from the following environment variables via the `/api/deployment-config` endpoint:

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DEPLOYMENT_MODE` | `'saas' \| 'selfhosted'` | `'selfhosted'` | The deployment mode of the application |
| `ENABLE_ACCOUNTS` | `'true' \| 'false'` | `'false'` | Whether to enable the account system |
| `ALLOW_ACCOUNT_REGISTRATION` | `'true' \| 'false'` | `'false'` | Whether to allow new account registration |

## Caching and Performance

The deployment context implements several performance optimizations:

1. **In-Memory Caching**: Configuration is cached in memory after the first fetch
2. **Throttled Refresh**: Window focus events only trigger a refresh if more than 5 minutes have passed since the last fetch
3. **Fallback Configuration**: If the API fails, a sensible default configuration is used
4. **Single Fetch**: Multiple components using the context share the same configuration data

## Error Handling

The context includes robust error handling:

1. **API Errors**: If the deployment config API fails, a fallback configuration is used
2. **Network Errors**: Network failures are logged and fallback configuration is applied
3. **Invalid Data**: Malformed API responses are handled gracefully with defaults
4. **Loading States**: Components can show appropriate loading indicators while configuration is being fetched

## Common Use Cases

### Conditional Feature Rendering

```typescript
function FeatureComponent() {
  const { isSaasMode, accountsEnabled } = useDeployment();
  
  return (
    <div>
      {isSaasMode && <SaasOnlyFeature />}
      {accountsEnabled && <AccountFeatures />}
    </div>
  );
}
```

### Navigation Logic

```typescript
function NavigationComponent() {
  const { accountsEnabled, registrationAllowed } = useDeployment();
  
  return (
    <nav>
      <Link href="/">Home</Link>
      {accountsEnabled && (
        <>
          <Link href="/login">Login</Link>
          {registrationAllowed && <Link href="/register">Register</Link>}
        </>
      )}
    </nav>
  );
}
```

### Configuration-Based Redirects

```typescript
function LoginPage() {
  const { isLoading, accountsEnabled } = useDeployment();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !accountsEnabled) {
      router.push('/');
    }
  }, [isLoading, accountsEnabled, router]);
  
  if (isLoading) return <div>Loading...</div>;
  if (!accountsEnabled) return null;
  
  return <LoginForm />;
}
```

## Implementation Details

The context uses:
- React's `createContext` and `useContext` for state management
- `fetch` API to retrieve configuration from `/api/deployment-config`
- Window focus events to refresh stale configuration
- Error boundaries and fallback states for reliability

## Cross-Platform Considerations

This context is designed to work in both web and mobile environments:

- Uses standard JavaScript APIs available in React Native
- Avoids browser-specific APIs except for window focus events
- For React Native, the window focus logic would need to be adapted to use AppState

When converting to React Native, you would need to:
1. Replace `window.addEventListener('focus', ...)` with `AppState.addEventListener('change', ...)`
2. Keep the rest of the implementation largely the same

## Server-Side Considerations

Since this is a client-side context (`'use client'`), it:
- Only runs in the browser/client environment
- Fetches configuration after the initial page load
- Cannot be used in server components directly

For server components that need deployment configuration, you should:
1. Read environment variables directly in server components
2. Pass configuration as props to client components
3. Use the context in client components for consistent state management

## Debugging

To debug deployment configuration issues:

```typescript
function DebugComponent() {
  const { getDeploymentInfo } = useDeployment();
  
  const debugInfo = getDeploymentInfo();
  
  return (
    <pre>
      {JSON.stringify(debugInfo, null, 2)}
    </pre>
  );
}
```

This will show you the current configuration, loading state, and when it was last fetched.
