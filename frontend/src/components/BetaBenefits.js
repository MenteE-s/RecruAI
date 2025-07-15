\Startup\MenteE\RecruAI\frontend\src\components\BetaBenefits.js
import React from 'react';

const BetaBenefits = () => {
  const benefits = [
    {
      icon: "🎁",
      title: "Free Beta Access",
      description: "Complete access to all features during beta period - no credit card required"
    },
    {
      icon: "💎",
      title: "50% Lifetime Discount",
      description: "Lock in 50% off regular pricing when we launch - exclusively for beta users"
    },
    {
      icon: "🏆",
      title: "Founder Recognition",
      description: "Special beta user badge and recognition as a founding member of our community"
    },
    {
      icon: "🚀",
      title: "Shape the Product",
      description: "Your feedback directly influences features and development priorities"
    },
    {
      icon: "📧",
      title: "VIP Updates",
      description: "Exclusive updates, behind-the-scenes content, and early access to new features"
    },
    {
      icon: "🎯",
      title: "Priority Support",
      description: "Direct line to our team with priority customer support and personalized help"
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