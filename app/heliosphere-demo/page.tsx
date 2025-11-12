/**
 * Sun-Centric Heliosphere Demo Page
 * Showcases the new dataset-driven architecture
 */

import { Metadata } from 'next';
import HeliosphereDemoClient from './HeliosphereDemoClient';

export const metadata: Metadata = {
  title: 'Sun-Centric Heliosphere | Demo',
  description: 'Interactive visualization of the heliosphere using precomputed datasets across the Sun\'s lifetime',
};

export default function HeliosphereDemoPage() {
  return (
    <main className="relative min-h-screen w-full bg-black">
      <HeliosphereDemoClient />
    </main>
  );
}

