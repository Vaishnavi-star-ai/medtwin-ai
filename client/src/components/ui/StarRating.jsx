import React from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export default function StarRating({ rating, size = 16, showValue = true, count = null }) {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.3;

  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) {
      stars.push(<FaStar key={i} size={size} className="text-amber-400" />);
    } else if (i === fullStars + 1 && hasHalf) {
      stars.push(<FaStarHalfAlt key={i} size={size} className="text-amber-400" />);
    } else {
      stars.push(<FaRegStar key={i} size={size} className="text-amber-300" />);
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">{stars}</div>
      {showValue && <span className="font-semibold text-dark-2 text-sm">{rating.toFixed(1)}</span>}
      {count !== null && <span className="text-gray-400 text-xs">({count.toLocaleString()})</span>}
    </div>
  );
}
