import React from 'react';
import MenteEHero from '../components/company/MenteEHero';
import MenteEProducts from '../components/company/MenteEProducts';
import MenteEAbout from '../components/company/MenteEAbout';
import MenteEFooter from '../components/company/MenteEFooter';
import MenteENavbar from '../components/company/MenteENavbar';
const MenteELanding = () => {
  return (
    <div className="min-h-screen">
      <MenteENavbar />
      <MenteEHero />
      <MenteEProducts />
      <MenteEAbout />
      <MenteEFooter />
    </div>
  );
};

export default MenteELanding;