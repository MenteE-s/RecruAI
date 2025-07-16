import React from 'react';
import RecruAINavbar from '../components/product/RecruAINavbar';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ'; // Add this import
import CTA from '../components/CTA';
import Footer from '../components/Footer';

const RecruAILanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <RecruAINavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ /> {/* Add FAQ before final CTA */}
      <CTA />
      <Footer />
    </div>
  );
};

export default RecruAILanding;