import React from 'react';

const RatingStars = ({ rating, size = 'md', showScore = false, interactive = false, onRatingChange }) => {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const starElement = (
        <span
          key={i}
          className={`${sizeClasses[size]} ${
            rating >= i ? 'text-yellow-400' : 'text-gray-300'
          } ${interactive ? 'cursor-pointer hover:text-yellow-400 transition-colors' : ''}`}
          onClick={interactive ? () => onRatingChange(i) : undefined}
        >
          ★
        </span>
      );
      stars.push(starElement);
    }
    return stars;
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-1">
        {renderStars()}
      </div>
      {showScore && (
        <span className="text-sm text-gray-600">
          {rating}/5
        </span>
      )}
    </div>
  );
};

export default RatingStars;
