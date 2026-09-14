import React from 'react';

const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseClasses = 'badge font-medium';
  
  const variants = {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success',
    error: 'badge-error',
    warning: 'badge-warning',
    info: 'badge-info',
    ghost: 'badge-ghost',
    outline: 'badge-outline'
  };

  const sizes = {
    xs: 'badge-xs text-xs',
    sm: 'badge-sm text-xs',
    md: 'text-sm',
    lg: 'badge-lg text-base'
  };

  const classes = [
    baseClasses,
    variants[variant] || variants.primary,
    sizes[size] || sizes.md,
    className
  ].filter(Boolean).join(' ');

  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export default Badge;
