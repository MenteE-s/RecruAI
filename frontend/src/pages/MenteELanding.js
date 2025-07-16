import React from 'react';
import MenteENavbar from '../components/company/MenteENavbar';
import MenteEHero from '../components/company/MenteEHero';
import MenteEAbout from '../components/company/MenteEAbout';
import MenteEProducts from '../components/company/MenteEProducts';
import Timeline from '../components/Timeline'; // Add this import
import CustomerSegments from '../components/CustomerSegments';
import MenteEFooter from '../components/company/MenteEFooter';

const MenteELanding = () => {
  return (
    <div className="min-h-screen bg-white">
      <MenteENavbar />
      <MenteEHero />
      <MenteEAbout />
      <MenteEProducts />
      <Timeline /> {/* Add Timeline after products */}
      <CustomerSegments />
      <MenteEFooter />
    </div>
  );
};

export default MenteELanding;