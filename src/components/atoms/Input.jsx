import React from 'react';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  helperText,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const inputClasses = [
    'input input-bordered w-full transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
    error ? 'input-error' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    leftIcon ? 'pl-10' : '',
    rightIcon ? 'pr-10' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="form-control w-full">
      {label && (
        <label className="label">
          <span className="label-text font-medium">
            {label}
            {required && <span className="text-error ml-1">*</span>}
          </span>
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50">
            {leftIcon}
          </div>
        )}
        
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={inputClasses}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50">
            {rightIcon}
          </div>
        )}
      </div>
      
      {(error || helperText) && (
        <label className="label">
          <span className={`label-text-alt ${error ? 'text-error' : 'text-base-content/60'}`}>
            {error || helperText}
          </span>
        </label>
      )}
    </div>
  );
};

export default Input;
