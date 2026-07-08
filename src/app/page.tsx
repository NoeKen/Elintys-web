import { GradientMesh } from '@/components/landing/GradientMesh';
import { ScrollProgress } from '@/components/landing/ScrollProgress';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { EventMarquee } from '@/components/landing/EventMarquee';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { SolutionStepper } from '@/components/landing/SolutionStepper';
import { FounderQuote } from '@/components/landing/FounderQuote';
import { WhyNowSection } from '@/components/landing/WhyNowSection';
import { FaqAccordion } from '@/components/landing/FaqAccordion';
import { CtaSection } from '@/components/landing/CtaSection';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function RootPage() {
  return (
    <div className="relative min-h-screen bg-primary overflow-x-hidden">
      <GradientMesh />
      <ScrollProgress />
      <LandingNav />
      <main className="relative">
        <LandingHero />
        <EventMarquee />
        <ProblemSection id="probleme" />
        <SolutionStepper id="solution" />
        <FounderQuote />
        <WhyNowSection />
        <FaqAccordion id="faq" />
        <CtaSection id="cta" />
      </main>
      <LandingFooter />
    </div>
  );
}
