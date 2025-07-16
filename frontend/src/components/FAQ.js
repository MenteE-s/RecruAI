import React, { useState } from 'react';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: "When will RecruAI actually launch?",
      answer: "We're targeting Q2 2025 for our beta launch with the first 100 users. Full public launch is planned for Q3 2025, but we'll be transparent about any delays."
    },
    {
      question: "Is this really free during beta?",
      answer: "Yes! Beta access is completely free with no credit card required. We want honest feedback, not payment during development."
    },
    {
      question: "How does the 50% lifetime discount work?",
      answer: "Beta users get 50% off our regular pricing for their first full year after we launch. If our regular price is $30/month, you'd pay $15/month."
    },
    {
      question: "What if RecruAI doesn't work as expected?",
      answer: "We're a small startup building something new - there will be bugs and missing features. That's why we need beta users to help us improve!"
    },
    {
      question: "How advanced is your AI technology?",
      answer: "We're building on proven AI models but this is our first product. The AI will improve significantly based on beta feedback and usage data."
    },
    {
      question: "Can I get a refund if I don't like it?",
      answer: "Beta is free, so no refunds needed! When we launch paid tiers, we'll have a fair refund policy."
    }
  ];

  return (
    <section id="faq" className="py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold text-secondary-900 mb-4">
            Honest Answers
          </h3>
          <p className="text-secondary-600">
            We believe in transparency. Here are straight answers to common questions.
          </p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border border-secondary-200 rounded-lg">
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-secondary-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-medium text-secondary-900">{faq.question}</span>
                <svg 
                  className={`w-5 h-5 transition-transform ${openIndex === index ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4">
                  <p className="text-secondary-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;