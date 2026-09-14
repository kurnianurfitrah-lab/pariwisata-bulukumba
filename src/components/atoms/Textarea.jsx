import React from 'react';

const Textarea = ({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  helperText,
  rows = 4,
  ...props
}) => {
  const textareaClasses = [
    'textarea textarea-bordered w-full transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
    'resize-none',
    error ? 'textarea-error' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
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
      
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        rows={rows}
        className={textareaClasses}
        {...props}
      />
      
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

export default Textarea;
