import React from 'react';
import { fireIcon, warmIcon, coldIcon } from '../../utils/icons';

const ScoreBadge = ({ score = 0, size = 'md', showLabel = true, className = '' }) => {
  // Determine score category and styling
  const getScoreInfo = (score) => {
    if (score >= 76) {
      return {
        label: 'Hot',
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: fireIcon,
        description: 'High engagement - Ready to buy'
      };
    } else if (score >= 51) {
      return {
        label: 'Warm',
        color: 'bg-orange-500',
        textColor: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: warmIcon,
        description: 'Active interest - Nurturing needed'
      };
    } else {
      return {
        label: 'Cold',
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: coldIcon,
        description: 'Low engagement - Requires outreach'
      };
    }
  };

  const scoreInfo = getScoreInfo(score);
  const Icon = scoreInfo.icon;

  // Size classes
  const sizeClasses = {
    sm: {
      badge: 'px-2 py-1 text-xs',
      icon: 'w-3 h-3',
      score: 'font-semibold'
    },
    md: {
      badge: 'px-3 py-1.5 text-sm',
      icon: 'w-4 h-4',
      score: 'font-bold'
    },
    lg: {
      badge: 'px-4 py-2 text-base',
      icon: 'w-5 h-5',
      score: 'font-bold'
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full border
        ${currentSize.badge}
        ${scoreInfo.bgColor}
        ${scoreInfo.borderColor}
        ${className}
      `}
      title={`${score}/100 - ${scoreInfo.description}`}
    >
      <Icon className={`${currentSize.icon} ${scoreInfo.textColor}`} />
      <span className={`${currentSize.score} ${scoreInfo.textColor}`}>
        {score}
      </span>
      {showLabel && (
        <span className={`${scoreInfo.textColor} text-xs font-medium`}>
          {scoreInfo.label}
        </span>
      )}
    </div>
  );
};

export default ScoreBadge;
