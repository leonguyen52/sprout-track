// This page is used for family root URLs (e.g., /snuggly-fawn/)
// The actual redirect logic is handled in layout.tsx
export default function FamilyRootPage() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );
} 