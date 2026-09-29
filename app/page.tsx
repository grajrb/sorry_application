import CouponGrid from "@/components/CouponGrid";
import DateBuilder from "@/components/DateBuilder";
import EvasiveButtons from "@/components/EvasiveButtons";
import Hero from "@/components/Hero";

/** A soft gradient divider between the big sections. */
function Divider({ emoji = "✨" }: { emoji?: string }) {
  return (
    <div aria-hidden="true" className="mx-auto flex max-w-3xl items-center gap-4 px-6">
      <span className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-transparent via-stitch-200 to-transparent" />
      <span className="animate-bob text-2xl">{emoji}</span>
      <span className="h-0.5 flex-1 rounded-full bg-gradient-to-r from-transparent via-stitch-200 to-transparent" />
    </div>
  );
}

export default function Home() {
  return (
    <main>
      <Hero />
      <Divider emoji="🥺" />
      <EvasiveButtons />
      <Divider emoji="🎟️" />
      <CouponGrid />
      <Divider emoji="🎨" />
      <DateBuilder />
    </main>
  );
}
