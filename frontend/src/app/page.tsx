"use client";

import { useRouter } from 'next/navigation';
import GrainHeroSection from '@/components/ui/grain-gradient-hero-section';

export default function Home() {
  const router = useRouter();

  return (
    <GrainHeroSection
      title="Build the Ultimate Hackathon Team"
      subtitle="Find the perfect teammates, manage your projects seamlessly, and conquer your next hackathon with TeamSync."
      ctaLabel="Get Started"
      onCtaClick={() => router.push('/auth/login')}
    />
  );
}