import React from 'react';
import RiskCard from './RiskCard';
import SpeakButton from './SpeakButton';

export default function MessageBubble({ message }) {
  const { role, text, triageResult, error } = message;
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold mr-3 flex-shrink-0 mt-0.5 shadow-md">
          H
        </div>
      )}

      <div className={`max-w-[75%] space-y-3`}>
        {/* Text bubble */}
        <div
          className={`px-5 py-3.5 rounded-2xl text-sm leading-relaxed font-medium transition-all ${
            isUser
              ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-tr-sm shadow-md hover:shadow-lg'
              : error
              ? 'bg-red-50 text-red-700 border border-red-300 rounded-tl-sm'
              : 'bg-white text-gray-800 shadow-sm border border-emerald-200 rounded-tl-sm hover:shadow-md hover:border-emerald-300'
          }`}
        >
          {text}
        </div>

        {/* Speak button (AI only) */}
        {!isUser && !error && <SpeakButton text={text} />}

        {/* Triage result card (AI only) */}
        {triageResult && (
          <RiskCard
            risk={triageResult.risk}
            advice={triageResult.brief_advice || triageResult.advice}
            action={triageResult.action}
            nepaliAdvice={triageResult.nepali_advice}
            nearestPost={triageResult.recommended_facilities?.[0] || triageResult.nearest_post}
            recommendedFacilityType={triageResult.recommended_facility_type}
            triageResult={triageResult}
          />
        )}
      </div>

      {isUser && (
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold ml-3 flex-shrink-0 mt-0.5 shadow-md">
          You
        </div>
      )}
    </div>
  );
}
