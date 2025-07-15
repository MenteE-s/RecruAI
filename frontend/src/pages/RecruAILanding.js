import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Testimonials from '../components/Testimonials';
import Pricing from '../components/Pricing';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import RecruAINavbar from '../components/product/RecruAINavbar';

const RecruAILanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <RecruAINavbar />
      <Hero />
      <Features />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
};

export default RecruAILanding;