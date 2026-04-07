import { notFound } from "next/navigation";
import { sampleSites } from "@/lib/data/sites";
import { SiteDetailView } from "@/components/sites/site-detail-view";

export default async function SiteDetailPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const site = sampleSites.find((s) => s.id === siteId);

  if (!site) {
    notFound();
  }

  return <SiteDetailView site={site} />;
}
