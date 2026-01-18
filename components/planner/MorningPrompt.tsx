import React from 'react';

export default function MorningPrompt(): React.JSX.Element {
  return (
    <div className="bg-gradient-to-r from-violet-600 to-black text-white p-4 rounded-xl">
      <p className="text-sm uppercase tracking-wide">
        Morning Intention
      </p>
      <h2 className="text-lg font-semibold mt-1">
        What good shall I do this day?
      </h2>
    </div>
  );
}
