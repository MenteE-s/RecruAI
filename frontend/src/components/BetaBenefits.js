\Startup\MenteE\RecruAI\frontend\src\components\BetaBenefits.js
import React from 'react';

const BetaBenefits = () => {
  const benefits = [
    {
      icon: "🎁",
      title: "Free Beta Access",
      description: "Complete access during our beta period - help us build something amazing"
    },
    {
      icon: "💎",
      title: "50% Launch Discount",
      description: "Lock in half-price for your first year when we officially launch"
    },
    {
      icon: "🏆",
      title: "Beta Contributor Badge",
      description: "Recognition as one of our founding users who helped shape the product"
    },
    {
      icon: "🚀",
      title: "Shape Our Product",
      description: "Your feedback directly influences features - be part of our development process"
    },
    {
      icon: "📧",
      title: "Insider Updates",
      description: "Behind-the-scenes development updates and first access to new features"
    },
    {
      icon: "🎯",
      title: "Direct Support",
      description: "Direct line to our small team - we'll personally help you succeed"
    }
  ];

  return (
    <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8">
      <h3 className="text-2xl font-bold text-secondary-900 mb-6 text-center">
        Why Join Our Beta? 🌟
      </h3>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, index) => (
          <div key={index} className="text-center">
            <div className="text-3xl mb-3">{benefit.icon}</div>
            <h4 className="font-semibold text-secondary-900 mb-2">{benefit.title}</h4>
            <p className="text-sm text-secondary-600">{benefit.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BetaBenefits;