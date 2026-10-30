import React from 'react';

interface CylindricalLoaderProps {
  text?: string;
  variant?: 'card' | 'inline';
}

export default function CylindricalLoader({
  text = 'LOADING',
  variant = 'card',
}: CylindricalLoaderProps) {
  const content = (
    <div className="loader">
      <div className="text"><span>{text}</span></div>
      <div className="text"><span>{text}</span></div>
      <div className="text"><span>{text}</span></div>
      <div className="text"><span>{text}</span></div>
      <div className="text"><span>{text}</span></div>
      <div className="text"><span>{text}</span></div>
      <div className="text"><span>{text}</span></div>
      <div className="text"><span>{text}</span></div>
      <div className="text"><span>{text}</span></div>
      <div className="line" />
    </div>
  );

  if (variant === 'inline') {
    return content;
  }

  return (
    <div className="loader-container">
      <div className="loader-card">
        {content}
      </div>
    </div>
  );
}
