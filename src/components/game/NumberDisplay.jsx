// src/components/game/NumberDisplay.jsx
import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { announceNumber } from '../../utils/audio';

const CurrentNumberDisplay = ({ number, isAnimating }) => {
  if (!number) {
    return (
      <div className="text-sm text-gray-600 text-center">
        Waiting for first number...
      </div>
    );
  }

  return (
    <div 
      className={`
        flex flex-col items-center justify-center
        transition-all duration-500 transform
        ${isAnimating ? 'scale-110' : 'scale-100'}
      `}
    >
      <div className="text-4xl sm:text-5xl font-bold text-blue-600 mb-1">
        {number}
      </div>
      <div className="text-xs text-gray-500">
        Current Number
      </div>
    </div>
  );
};

const RecentNumbersList = ({ numbers }) => {
  return (
    <div className="grid grid-cols-5 gap-1">
      {numbers.map((number, index) => (
        <div
          key={`${number}-${index}`}
          className={`
            h-8 w-8 sm:h-10 sm:w-10
            flex items-center justify-center
            rounded-full
            ${index === 0 
              ? 'bg-blue-100 text-blue-700 font-semibold border-2 border-blue-300' 
              : 'bg-white border border-gray-200 text-gray-700'
            }
            text-sm
          `}
        >
          {number}
        </div>
      ))}
    </div>
  );
};

const NumberDisplay = () => {
  const { currentGame, phase } = useGame();
  const [isAnimating, setIsAnimating] = useState(false);
  const [previousNumber, setPreviousNumber] = useState(null);
  const [recentNumbers, setRecentNumbers] = useState([]);

  useEffect(() => {
    if (!currentGame?.numberSystem?.calledNumbers) return;

    const numbers = currentGame.numberSystem.calledNumbers;
    const currentNumber = numbers[numbers.length - 1];

    if (currentNumber && currentNumber !== previousNumber) {
      // Trigger animation and sound
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 1000);
      
      // Announce the number
      announceNumber(currentNumber);
      
      setPreviousNumber(currentNumber);
      
      // Update recent numbers (last 5 in reverse order)
      setRecentNumbers(numbers.slice(-5).reverse());
    }
  }, [currentGame?.numberSystem?.calledNumbers, previousNumber]);

  if (phase !== 3) {
    return (
      <div className="card animate-fade-in shadow-sm">
        <div className="p-1 sm:p-4 text-center">
          <h2 className="text-base font-semibold text-gray-900 mb-1 sm:mb-2">
            Game Status
          </h2>
          <p className="text-sm text-gray-600">
            {phase === 1 ? "Game setup in progress" : "Ticket booking is open"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in shadow-sm">
      {/* Current Number Display */}
      <div className="p-1 sm:p-4 border-b border-gray-100">
        <CurrentNumberDisplay 
          number={previousNumber} 
          isAnimating={isAnimating}
        />
      </div>

      {/* Recent Numbers */}
      <div className="bg-gray-50 p-1 sm:p-3">
        <h3 className="text-xs font-medium text-gray-700 mb-1 sm:mb-2">
          Recent Numbers
        </h3>
        <RecentNumbersList numbers={recentNumbers} />
      </div>

      {/* Game Progress */}
      {currentGame?.numberSystem?.calledNumbers && (
        <div className="px-1 sm:px-3 py-1 sm:py-2 border-t border-gray-100">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <span>
              Called: {currentGame.numberSystem.calledNumbers.length}
            </span>
            <span>
              Left: {90 - currentGame.numberSystem.calledNumbers.length}
            </span>
          </div>
          <div className="mt-1 w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{
                width: `${(currentGame.numberSystem.calledNumbers.length / 90) * 100}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default NumberDisplay;
