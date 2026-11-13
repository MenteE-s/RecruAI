import React from 'react';
import Hero from '../components/Hero';
import Features from '../components/Features';
import HowItWorks from '../components/HowItWorks';
import CustomerSegments from '../components/CustomerSegments';
import FeaturedJobs from '../components/FeaturedJobs';
import Pricing from '../components/Pricing';
import Testimonials from '../components/Testimonials';
import CTA from '../components/CTA';
import Footer from '../components/Footer';
import RecruAINavbar from '../components/product/RecruAINavbar';

const RecruAILanding = () => {
  return (
    <div className="min-h-screen bg-surface text-ink transition-colors overflow-x-hidden page-transition">
      <RecruAINavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CustomerSegments />
      <FeaturedJobs />
      <Pricing />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
};

export default RecruAILanding;