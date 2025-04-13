// src/components/game/NumberBoard.jsx
import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext';

const NumberCell = ({ number, isCalled, isLastCalled }) => {
  const baseClasses = `
    relative
    aspect-square
    flex
    items-center
    justify-center
    text-xs
    md:text-sm
    font-medium
    rounded
    transition-all
    duration-300
    cursor-default
    border
  `;

  const stateClasses = isCalled
    ? `bg-blue-100 text-blue-800 border-blue-300 ${
        isLastCalled ? 'ring-1 ring-blue-500 ring-offset-1 scale-105 shadow' : ''
      }`
    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50';

  return (
    <div className={`${baseClasses} ${stateClasses}`}>
      {number}
    </div>
  );
};

const LastCalledNumber = ({ number }) => {
  if (!number) return null;

  return (
    <div className="bg-blue-50 p-3 rounded-lg text-center">
      <p className="text-xs text-blue-600 font-medium">Last Called</p>
      <div className="text-3xl font-bold text-blue-700 animate-bounce">
        {number}
      </div>
    </div>
  );
};

const GameStats = ({ calledCount }) => {
  const total = 90;
  const remaining = total - calledCount;
  const percentage = Math.round((calledCount / total) * 100);

  return (
    <div className="grid grid-cols-3 gap-2 text-center p-3 bg-gray-50 rounded-lg">
      <div>
        <p className="text-xs text-gray-600">Called</p>
        <p className="text-sm font-semibold text-blue-600">{calledCount}</p>
      </div>
      <div>
        <p className="text-xs text-gray-600">Remaining</p>
        <p className="text-sm font-semibold text-gray-800">{remaining}</p>
      </div>
      <div>
        <p className="text-xs text-gray-600">Progress</p>
        <p className="text-sm font-semibold text-green-600">{percentage}%</p>
      </div>
    </div>
  );
};

const NumberBoard = () => {
  const { calledNumbers, lastCalledNumber, phase, isPlayingPhase } = useGame();

  // Create array of numbers 1-90
  const numbers = useMemo(() => 
    Array.from({ length: 90 }, (_, index) => index + 1),
    []
  );

  if (!isPlayingPhase) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Game Status
        </h2>
        <p className="text-gray-600">
          {phase === 1 ? "Game setup in progress" : "Ticket booking is open"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="space-y-3 p-3">
        {/* Two-column layout for top section */}
        <div className="grid grid-cols-2 gap-3">
          {/* Last Called Number Display */}
          <LastCalledNumber number={lastCalledNumber} />

          {/* Game Statistics */}
          <GameStats calledCount={calledNumbers.length} />
        </div>

        {/* Progress Bar */}
        <div className="relative h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${(calledNumbers.length / 90) * 100}%` }}
          />
        </div>

        {/* Numbers Grid - Compact Version */}
        <div className="grid grid-cols-10 gap-0.5 sm:gap-1">
          {numbers.map((number) => (
            <NumberCell
              key={number}
              number={number}
              isCalled={calledNumbers.includes(number)}
              isLastCalled={number === lastCalledNumber}
            />
          ))}
        </div>
      </div>

      {/* Mobile-friendly called numbers list - More compact */}
      <div className="block sm:hidden border-t border-gray-200 p-2">
        <p className="text-xs font-medium text-gray-600 mb-1">Recent Numbers</p>
        <div className="flex flex-wrap gap-1">
          {[...calledNumbers].reverse().slice(0, 10).map((number) => (
            <span
              key={number}
              className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
            >
              {number}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NumberBoard;