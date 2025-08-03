import React, { Suspense } from 'react';
import VerifyAccountForm from './VerifyAccountForm';

function VerifyAccountLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
            Loading...
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Please wait while we prepare the page for you.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyAccountPage() {
  return (
    <Suspense fallback={<VerifyAccountLoading />}>
      <VerifyAccountForm />
    </Suspense>
  );
}
