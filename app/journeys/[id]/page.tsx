import JourneyDetailPageClient from "./JourneyDetailClient";

export function generateStaticParams() {
  // Return a placeholder so Next.js recognizes the dynamic route
  // for static export. Actual journey data is loaded client-side.
  return [{ id: "placeholder" }];
}

export const dynamicParams = true;

export default function JourneyDetailPage() {
  return <JourneyDetailPageClient />;
}
