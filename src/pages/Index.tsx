
import React from 'react';
import { PageTransition } from '@/components/layout/PageTransition';
import { HeroSection } from '@/components/home/HeroSection';
import { FeatureSection } from '@/components/home/FeatureSection';
import { PersonalGrowthSection } from '@/components/home/PersonalGrowthSection';
import { BrainVisualSection } from '@/components/home/BrainVisualSection';

export default function Home() {
  return (
    <PageTransition>
      <div className="min-h-screen">
        <HeroSection />
        <FeatureSection />
        <PersonalGrowthSection />
        <BrainVisualSection />
      </div>
    </PageTransition>
  );
}
