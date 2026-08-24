import { notFound } from "next/navigation";
import { works } from "@/data/works";
import WorkHeader from "@/components/work/WorkHeader";
import KeyFactsPanel from "@/components/work/KeyFactsPanel";
import WhyFlaggedSection from "@/components/work/WhyFlaggedSection";
import ActionChecklist from "@/components/work/ActionChecklist";

interface WorkDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return works.map((w) => ({ id: w.id }));
}

export async function generateMetadata({ params }: WorkDetailPageProps) {
  const { id } = await params;
  const work = works.find((w) => w.id === id);
  if (!work) return { title: "Work Not Found" };
  return {
    title: `${work.id} — Investigation Detail | MPLADS Risk Analytics`,
    description: `Risk investigation detail for ${work.agencyName}, ${work.district}. Risk score: ${work.riskScore}/100.`,
  };
}

export default async function WorkDetailPage({ params }: WorkDetailPageProps) {
  const { id } = await params;
  const work = works.find((w) => w.id === id);
  if (!work) notFound();

  return (
    <div className="space-y-4 max-w-5xl">
      <WorkHeader work={work} />
      <KeyFactsPanel work={work} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WhyFlaggedSection reasons={work.reasons} />
        <ActionChecklist actions={work.recommendedActions} />
      </div>
    </div>
  );
}
