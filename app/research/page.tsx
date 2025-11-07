import type { Metadata } from 'next';
import ResearchGradeClientWrapper from '../components/ResearchGradeClientWrapper';

export const metadata: Metadata = {
  title: 'Heliosphere Research Visualization — Scientific Accuracy',
  description: 'Research-grade visualization of the heliosphere with real Voyager trajectories, MHD physics, and accurate astronomical data.',
  openGraph: {
    title: 'Heliosphere Research Visualization',
    description: 'Scientifically accurate heliosphere simulation with NASA data',
    images: ['/img/heliosphere-research.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heliosphere Research Visualization',
    description: 'Scientifically accurate heliosphere simulation with NASA data',
    images: ['/img/heliosphere-research.png'],
  },
};

export default function ResearchPage() {
  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Deep space background */}
      <div className="absolute inset-0 pointer-events-none z-0" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.3) 90%, rgba(0, 0, 0, 0.5) 100%)',
      }} />

      {/* Main content */}
      <section className="relative min-h-screen flex flex-col items-center justify-center">
        {/* WebGL Canvas - Full background */}
        <div className="absolute inset-0 z-0">
          <ResearchGradeClientWrapper />
        </div>

        {/* Title overlay */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 text-center">
          <h1 className="text-2xl font-bold text-white/90 drop-shadow-lg">
            Research-Grade Heliosphere
          </h1>
          <p className="text-sm text-white/70 mt-1">
            NASA JPL Ephemerides • Voyager Mission Data • MHD Physics
          </p>
        </div>

        {/* Attribution */}
        <div className="fixed bottom-4 left-4 z-10 text-xs text-white/40">
          <p>Data: NASA/JPL, Voyager, IBEX</p>
          <p>Model: Opher et al. 2020</p>
        </div>

        {/* Controls hint */}
        <div className="fixed bottom-4 right-4 z-10 text-xs text-white/40 text-right">
          <p>Mouse: Rotate • Scroll: Zoom • Drag: Pan</p>
          <p>Space: Play/Pause • ←→: Skip</p>
        </div>
      </section>

      {/* Scientific disclaimer */}
      <div className="sr-only">
        This visualization represents the current scientific understanding of the heliosphere
        based on data from NASA's Voyager missions, IBEX, and magnetohydrodynamic modeling.
        Some features like the bow shock remain theoretical. Distances are compressed for visibility.
      </div>
    </main>
  );
}
