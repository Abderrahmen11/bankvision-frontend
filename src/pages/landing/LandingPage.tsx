import React from 'react'
import { LandingNavbar } from './components/LandingNavbar'
import { HeroSection } from './components/HeroSection'
import { StatsRibbon } from './components/StatsRibbon'
import { CapabilitiesSection } from './components/CapabilitiesSection'
import { PersonasSection } from './components/PersonasSection'
import { CtaBanner } from './components/CtaBanner'
import { LandingFooter } from './components/LandingFooter'
import './LandingPage.css'

export const LandingPage: React.FC = () => {
  return (
    <div className="landing-root">
      <LandingNavbar />
      <HeroSection />
      <StatsRibbon />
      <CapabilitiesSection />
      <PersonasSection />
      <CtaBanner />
      <LandingFooter />
    </div>
  )
}
