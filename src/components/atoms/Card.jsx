import React from 'react';

const Card = ({
  children,
  className = '',
  padding = 'p-6',
  shadow = 'shadow-sm',
  border = 'border border-base-content/5',
  hover = false,
  ...props
}) => {
  const cardClasses = [
    'card bg-base-100 rounded-box transition-all duration-200',
    padding,
    shadow,
    border,
    hover ? 'hover:shadow-md hover:scale-[1.02] cursor-pointer' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {children}
    </div>
  );
};

// Card Header Component
Card.Header = ({ children, className = '', ...props }) => (
  <div className={`card-header ${className}`} {...props}>
    {children}
  </div>
);

// Card Body Component
Card.Body = ({ children, className = '', ...props }) => (
  <div className={`card-body ${className}`} {...props}>
    {children}
  </div>
);

// Card Footer Component
Card.Footer = ({ children, className = '', ...props }) => (
  <div className={`card-actions justify-end ${className}`} {...props}>
    {children}
  </div>
);

export default Card;
