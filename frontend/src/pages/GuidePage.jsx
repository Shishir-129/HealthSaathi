import React from 'react';
import { useApp } from '../context/AppContext';

export default function GuidePage() {
  const { t } = useApp();
  
  const guidanceSteps = [
    {
      step: '1',
      title: t.guide?.step1Title || 'Describe Your Symptoms',
      desc: t.guide?.step1Desc || 'Type or speak your symptoms naturally',
      icon: '💬',
      tips: [
        t.guide?.step1Tip1 || 'Be as detailed as possible',
        t.guide?.step1Tip2 || 'Mention when symptoms started',
        t.guide?.step1Tip3 || 'Include severity if known'
      ]
    },
    {
      step: '2',
      title: t.guide?.step2Title || 'AI Analysis',
      desc: t.guide?.step2Desc || 'Our AI analyzes your symptoms',
      icon: '🧠',
      tips: [
        t.guide?.step2Tip1 || 'Risk assessment (Low/Medium/High)',
        t.guide?.step2Tip2 || 'Personalized advice provided',
        t.guide?.step2Tip3 || 'Facility recommendations'
      ]
    },
    {
      step: '3',
      title: t.guide?.step3Title || 'Get Recommendations',
      desc: t.guide?.step3Desc || 'Receive healthcare facility suggestions',
      icon: '🏥',
      tips: [
        t.guide?.step3Tip1 || 'Nearby hospitals & clinics',
        t.guide?.step3Tip2 || 'Pharmacies in your area',
        t.guide?.step3Tip3 || 'Distance and directions'
      ]
    },
    {
      step: '4',
      title: t.guide?.step4Title || 'Track Your Health',
      desc: t.guide?.step4Desc || 'Keep your consultation history safe',
      icon: '📋',
      tips: [
        t.guide?.step4Tip1 || 'Automatic record keeping',
        t.guide?.step4Tip2 || 'Review past consultations',
        t.guide?.step4Tip3 || 'Monitor your health trends'
      ]
    },
  ];

  return (
    <div className="flex h-full bg-gradient-to-br from-white via-emerald-50/20 to-white overflow-y-auto p-6">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.guide?.title || 'How HealthSathi Works'}</h1>
          <p className="text-gray-600">{t.guide?.subtitle || 'Follow these simple steps to get personalized health guidance'}</p>
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
          <h3 className="text-2xl font-bold mb-2">{t.guide?.ctaTitle || 'Ready to Get Started?'}</h3>
          <p className="mb-4 text-teal-100">{t.guide?.ctaDesc || 'Go to AI Triage Chat to describe your symptoms and get personalized recommendations.'}</p>
          <a
            href="/chat"
            className="inline-block bg-white text-teal-600 font-bold px-6 py-2.5 rounded-lg hover:bg-teal-50 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {t.guide?.ctaButton || 'Start Consultation →'}
          </a>
        </div>
      </div>
    </div>
  );
}
