import React from 'react';

const MenteEAbout = () => {
  const values = [
    {
      icon: "🎯",
      title: "Mission-driven",
      description: "We believe everyone deserves access to tools that can accelerate their professional growth."
    },
    {
      icon: "🤖",
      title: "AI-first",
      description: "We leverage cutting-edge AI to provide personalized, scalable solutions for career development."
    },
    {
      icon: "📊",
      title: "Data-informed",
      description: "Every feature is built on insights from real interview data and career progression patterns."
    },
    {
      icon: "🌟",
      title: "User-focused",
      description: "We obsess over user experience, making complex AI accessible and actionable for everyone."
    }
  ];

  const team = [
    {
      name: "Syed Syab Ahmad",
      role: "Developer",
      background: "SE Graduate, Machine Learning Engineer",
      image: "Profile Picture.jpg"
    },
    {
      name: "Hamza Rustam",
      role: "Developer",
      background: "SE Graduate, Python Developer",
      image: "Hamza.jpeg"
    },
    {
      name: "Sania Shakeel",
      role: "Developer", 
      background: "CS Undergraduate, Junior Scientist",
      image: "sania.jpg"
    },
    {
      name: "Mahboob Iqbal",
      role: "Developer",
      background: "SE Graduate, Web Developer",
      image: "mahboob.jpeg"
    },
    
  ];

  return (
    <section id="about" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* About Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-secondary-900 mb-6">
            Building the future of professional development
          </h2>
          <p className="text-xl text-secondary-600 max-w-4xl mx-auto leading-relaxed">
            MenteE was founded on the belief that AI can democratize access to high-quality career 
            development resources. We're building tools that help professionals at every stage 
            reach their full potential.
          </p>
        </div>

        {/* Story */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h3 className="text-3xl font-bold text-secondary-900 mb-6">Our story</h3>
            <div className="space-y-4 text-lg text-secondary-600">
              <p>
                After seeing countless talented individuals struggle with interview preparation 
                and career advancement, our founders decided to build AI-powered solutions 
                that level the playing field.
              </p>
              <p>
                What started as RecruAI - an interview practice platform - has evolved into 
                a comprehensive suite of AI tools designed to support professionals throughout 
                their entire career journey.
              </p>
              <p>
                We're currently in beta with early adopters providing valuable feedback. 
                Our goal is to launch with a product that truly makes a difference in people's careers.
              </p>
            </div>
          </div>
          <div className="bg-secondary-50 rounded-2xl p-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">2024</div>
                <div className="text-secondary-600">Founded</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">500+</div>
                <div className="text-secondary-600">Beta signups</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">$500K</div>
                <div className="text-secondary-600">Pre-seed funding</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">8</div>
                <div className="text-secondary-600">Team members</div>
              </div>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold text-secondary-900 text-center mb-12">Our values</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl mb-4">{value.icon}</div>
                <h4 className="text-xl font-bold text-secondary-900 mb-3">{value.title}</h4>
                <p className="text-secondary-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
              <div>
              <h3 className="text-3xl font-bold text-secondary-900 text-center mb-12">Meet the team</h3>
              <div className="relative overflow-hidden">
                <div className="flex animate-scroll-slow">
                {[...team, ...team].map((member, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 text-center flex-shrink-0 w-72 mx-4">
                  <div className="mb-6 flex justify-center">
                    <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary-100" 
                    />
                  </div>
                  <h4 className="text-lg font-bold text-secondary-900 mb-2">{member.name}</h4>
                  <p className="text-primary-600 font-semibold mb-3">{member.role}</p>
                  <p className="text-sm text-secondary-600 leading-relaxed">{member.background}</p>
                  </div>
                ))}
                </div>
              </div>
              </div>

              {/* CTA */}
        <div className="text-center mt-20 bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-12">
          <h3 className="text-3xl font-bold text-secondary-900 mb-4">
            Join our mission
          </h3>
          <p className="text-xl text-secondary-600 mb-8">
            Be part of the revolution in professional development. Join our beta waitlist today.
          </p>
          <button 
            onClick={() => window.open('https://forms.gle/WfroWeDqDcNCYF9s5', '_blank')}
            className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-xl font-semibold transition-all transform hover:scale-105"
          >
            Join Beta Waitlist
          </button>
        </div>
      </div>
    </section>
  );
};

export default MenteEAbout;