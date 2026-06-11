import EditJourneyPageClient from "./EditJourneyClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export const dynamicParams = true;

export default function EditJourneyPage() {
  return <EditJourneyPageClient />;
}
