import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import CustomerSegments from '../components/CustomerSegments';
import Pricing from '../components/Pricing';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import RecruAINavbar from '../components/product/RecruAINavbar';

const RecruAILanding = () => {
  return (
    <div className="min-h-screen">
        <RecruAINavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CustomerSegments />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
};

export default RecruAILanding;