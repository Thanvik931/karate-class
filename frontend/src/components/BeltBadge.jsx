import React from 'react';

const BELT_COLORS = {
  White: 'bg-white text-slate-900 border border-slate-300',
  Yellow: 'bg-yellow-400 text-yellow-950 font-bold',
  Orange: 'bg-orange-500 text-white font-bold',
  Green: 'bg-emerald-600 text-white font-bold',
  Purple: 'bg-purple-600 text-white font-bold',
  Blue: 'bg-blue-600 text-white font-bold',
  'Brown III': 'bg-amber-900 text-amber-100 font-bold border-l-4 border-yellow-400',
  'Brown II': 'bg-amber-900 text-amber-100 font-bold border-l-4 border-yellow-300',
  'Brown I': 'bg-amber-900 text-amber-100 font-bold border-l-4 border-yellow-200',
  Black: 'bg-slate-950 text-yellow-400 font-extrabold border border-yellow-500 shadow-sm'
};

export default function BeltBadge({ beltRank, className = '' }) {
  const badgeStyle = BELT_COLORS[beltRank] || 'bg-gray-200 text-gray-800';

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs uppercase tracking-wider shadow-xs ${badgeStyle} ${className}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
      {beltRank || 'White'} Belt
    </span>
  );
}
