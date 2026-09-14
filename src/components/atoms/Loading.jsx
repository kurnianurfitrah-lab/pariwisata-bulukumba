import React from 'react';

const Loading = ({
  size = 'md',
  variant = 'spinner',
  text = '',
  className = '',
  ...props
}) => {
  const sizes = {
    xs: 'loading-xs',
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  };

  const variants = {
    spinner: 'loading-spinner',
    dots: 'loading-dots',
    ring: 'loading-ring',
    ball: 'loading-ball',
    bars: 'loading-bars',
    infinity: 'loading-infinity'
  };

  const classes = [
    'loading',
    variants[variant] || variants.spinner,
    sizes[size] || sizes.md,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="flex items-center justify-center" {...props}>
      <span className={classes} />
      {text && <span className="ml-2 text-base-content/60">{text}</span>}
    </div>
  );
};

// Loading Spinner Component
Loading.Spinner = ({ size = 'md', className = '', ...props }) => (
  <Loading size={size} variant="spinner" className={className} {...props} />
);

// Loading Dots Component
Loading.Dots = ({ size = 'md', className = '', ...props }) => (
  <Loading size={size} variant="dots" className={className} {...props} />
);

// Loading Ring Component
Loading.Ring = ({ size = 'md', className = '', ...props }) => (
  <Loading size={size} variant="ring" className={className} {...props} />
);

// Loading Ball Component
Loading.Ball = ({ size = 'md', className = '', ...props }) => (
  <Loading size={size} variant="ball" className={className} {...props} />
);

// Loading Bars Component
Loading.Bars = ({ size = 'md', className = '', ...props }) => (
  <Loading size={size} variant="bars" className={className} {...props} />
);

// Loading Infinity Component
Loading.Infinity = ({ size = 'md', className = '', ...props }) => (
  <Loading size={size} variant="infinity" className={className} {...props} />
);

export default Loading;
