import React from 'react';

export default function GuidePage() {
  const guidanceSteps = [
    {
      step: '1',
      title: 'Describe Your Symptoms',
      desc: 'Type or speak your symptoms naturally',
      icon: '💬',
      tips: ['Be as detailed as possible', 'Mention when symptoms started', 'Include severity if known']
    },
    {
      step: '2',
      title: 'AI Analysis',
      desc: 'Our AI analyzes your symptoms',
      icon: '🧠',
      tips: ['Risk assessment (Low/Medium/High)', 'Personalized advice provided', 'Facility recommendations']
    },
    {
      step: '3',
      title: 'Get Recommendations',
      desc: 'Receive healthcare facility suggestions',
      icon: '🏥',
      tips: ['Nearby hospitals & clinics', 'Pharmacies in your area', 'Distance and directions']
    },
    {
      step: '4',
      title: 'Track Your Health',
      desc: 'Keep your consultation history safe',
      icon: '📋',
      tips: ['Automatic record keeping', 'Review past consultations', 'Monitor your health trends']
    },
  ];

  return (
    <div className="flex h-full bg-gradient-to-br from-white via-emerald-50/20 to-white overflow-y-auto p-6">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">How HealthSaathi Works</h1>
          <p className="text-gray-600">Follow these simple steps to get personalized health guidance</p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guidanceSteps.map((step) => (
            <div
              key={step.step}
              className="bg-white rounded-2xl p-6 border border-emerald-200 hover:shadow-lg transition-all duration-300"
            >
              {/* Step Number and Icon */}
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {step.step}
                </div>
                <span className="text-3xl mt-1">{step.icon}</span>
              </div>

              {/* Content */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h2>
              <p className="text-gray-600 text-sm mb-4">{step.desc}</p>

              {/* Tips */}
              <ul className="space-y-2">
                {step.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 font-bold mt-0.5">✓</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
          <p className="mb-4 text-teal-100">Go to AI Triage Chat to describe your symptoms and get personalized recommendations.</p>
          <a
            href="/chat"
            className="inline-block bg-white text-teal-600 font-bold px-6 py-2.5 rounded-lg hover:bg-teal-50 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            Start Consultation →
          </a>
        </div>
      </div>
    </div>
  );
}
