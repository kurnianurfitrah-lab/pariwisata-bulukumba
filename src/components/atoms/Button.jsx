import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  ...props 
}) => {
  const baseClasses = 'btn font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'btn-primary text-white hover:bg-primary-focus',
    secondary: 'btn-secondary text-white hover:bg-secondary-focus',
    success: 'btn-success text-white hover:bg-success-focus',
    error: 'btn-error text-white hover:bg-error-focus',
    warning: 'btn-warning text-white hover:bg-warning-focus',
    info: 'btn-info text-white hover:bg-info-focus',
    ghost: 'btn-ghost hover:bg-base-200',
    outline: 'btn-outline border-2 hover:bg-base-200',
    soft: 'btn-soft bg-primary/10 text-primary hover:bg-primary/20',
    link: 'btn-link text-primary hover:text-primary-focus underline-offset-4'
  };

  const sizes = {
    xs: 'btn-xs px-2 py-1 text-xs',
    sm: 'btn-sm px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'btn-lg px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };

  const classes = [
    baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="loading loading-spinner loading-xs mr-2" />}
      {children}
    </button>
  );
};

export default Button;
