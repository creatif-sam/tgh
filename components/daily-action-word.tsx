import React, { useEffect, useState } from 'react';

const DailyActionWord: React.FC = () => {
  const [actionWord, setActionWord] = useState('');
  const [bibleVerse, setBibleVerse] = useState('');

  useEffect(() => {
    // Example action words and Bible verses
    const actionWords = ['Faith', 'Hope', 'Love', 'Courage', 'Patience'];
    const bibleVerses = [
      'Hebrews 11:1 - Now faith is the substance of things hoped for, the evidence of things not seen.',
      'Romans 15:13 - May the God of hope fill you with all joy and peace as you trust in him.',
      '1 Corinthians 13:13 - And now these three remain: faith, hope and love. But the greatest of these is love.',
      'Joshua 1:9 - Be strong and courageous. Do not be afraid; do not be discouraged, for the Lord your God will be with you wherever you go.',
      'James 1:4 - Let perseverance finish its work so that you may be mature and complete, not lacking anything.'
    ];

    // Pick a random action word and corresponding Bible verse
    const randomIndex = Math.floor(Math.random() * actionWords.length);
    setActionWord(actionWords[randomIndex]);
    setBibleVerse(bibleVerses[randomIndex]);
  }, []);

  return (
    <div
      className="bg-gradient-to-r from-purple-500 to-black text-white p-6 text-center rounded-md shadow-md"
    >
      <h1 className="text-3xl font-bold">{actionWord}</h1>
      <p className="mt-2 text-lg italic">{bibleVerse}</p>
    </div>
  );
};

export default DailyActionWord;