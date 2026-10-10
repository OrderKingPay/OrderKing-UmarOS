import React, { useState } from 'react';

const HDmaster = () => {
  // State for toggles
  const [aiTutorPricing, setAiTutorPricing] = useState('Trial'); // Free, Paid, Trial
  const [automatedSupport, setAutomatedSupport] = useState(true);
  const [globalSurge, setGlobalSurge] = useState(false);

  // State for Syllabus
  const [syllabus, setSyllabus] = useState([
    { id: 1, title: 'Module 1: Basic Greetings', active: true },
    { id: 2, title: 'Module 2: Business Negotiation', active: true },
    { id: 3, title: 'Module 3: Advanced Phrasal Verbs', active: false },
  ]);

  const toggleSyllabus = (id) => {
    setSyllabus(syllabus.map(item => 
      item.id === id ? { ...item, active: !item.active } : item
    ));
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans p-10 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <header className="mb-16 border-b border-gray-800 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-light tracking-widest uppercase text-gray-100">HDmaster</h1>
            <p className="text-xs text-gray-500 tracking-widest mt-2">UmarOS Central Control</p>
          </div>
          <div className="text-xs text-gray-500 tracking-widest uppercase">God Mode: Active</div>
        </header>

        <section className="mb-16">
          <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-8">System Overrides</h2>
          <div className="space-y-6">
            
            {/* AI Tutor Pricing */}
            <div className="flex justify-between items-center border-b border-gray-900 pb-4">
              <span className="text-lg font-light">AI Tutor Pricing</span>
              <div className="flex space-x-2">
                {['Free', 'Trial', 'Paid'].map(plan => (
                  <button 
                    key={plan}
                    onClick={() => setAiTutorPricing(plan)}
                    className={`px-4 py-1 text-sm rounded-full transition-all duration-300 ${
                      aiTutorPricing === plan 
                        ? 'bg-white text-black font-medium' 
                        : 'text-gray-500 hover:text-white border border-gray-800'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>

            {/* Automated Support */}
            <div className="flex justify-between items-center border-b border-gray-900 pb-4">
              <span className="text-lg font-light">Automated AI Support (Employee-less)</span>
              <button 
                onClick={() => setAutomatedSupport(!automatedSupport)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${automatedSupport ? 'bg-white' : 'bg-gray-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-black absolute top-1 transition-all duration-300 ${automatedSupport ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Global Surge */}
            <div className="flex justify-between items-center border-b border-gray-900 pb-4">
              <span className="text-lg font-light">Global Surge Override</span>
              <button 
                onClick={() => setGlobalSurge(!globalSurge)}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${globalSurge ? 'bg-red-600' : 'bg-gray-800'}`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${globalSurge ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
            
          </div>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-widest text-gray-500 mb-8">AI Tutor Syllabus Management</h2>
          <div className="space-y-4">
            {syllabus.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-gray-900 rounded-lg border border-gray-800">
                <span className={`text-lg font-light ${item.active ? 'text-white' : 'text-gray-600'}`}>
                  {item.title}
                </span>
                <button 
                  onClick={() => toggleSyllabus(item.id)}
                  className={`text-xs uppercase tracking-widest px-3 py-1 rounded transition-colors ${
                    item.active ? 'bg-white text-black' : 'bg-transparent text-gray-500 border border-gray-700'
                  }`}
                >
                  {item.active ? 'Active' : 'Enable'}
                </button>
              </div>
            ))}
            <button className="mt-4 text-xs text-gray-500 uppercase tracking-widest hover:text-white transition-colors">
              + Add New Module
            </button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default HDmaster;
