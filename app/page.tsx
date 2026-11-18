'use client';

import { useState } from 'react';

import { CreateRoomModal, JoinRoomModal } from '../components/landing/modals';
import { CtaSection } from '../components/landing/cta-section';
import { Features } from '../components/landing/features';
import { Footer } from '../components/landing/footer';
import { Hero } from '../components/landing/hero';
import { HowItWorks } from '../components/landing/how-it-works';
import { Navbar } from '../components/landing/navbar';
import { SupportedMaps } from '../components/landing/supported-maps/supported-maps';

export default function LandingPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <>
      <Navbar onCreateClick={() => setCreateOpen(true)} onJoinClick={() => setJoinOpen(true)} />
      <main>
        <Hero onCreateClick={() => setCreateOpen(true)} />
        <Features />
        <HowItWorks />
        <SupportedMaps />
        <CtaSection onCreateClick={() => setCreateOpen(true)} />
      </main>
      <Footer />

      <CreateRoomModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinRoomModal open={joinOpen} onClose={() => setJoinOpen(false)} />
    </>
  );
}
