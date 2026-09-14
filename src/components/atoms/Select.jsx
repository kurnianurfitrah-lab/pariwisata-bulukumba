import React from 'react';

const Select = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Pilih opsi...',
  error,
  disabled = false,
  required = false,
  className = '',
  helperText,
  ...props
}) => {
  const selectClasses = [
    'select select-bordered w-full transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
    error ? 'select-error' : '',
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
      
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={selectClasses}
        {...props}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
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

export default Select;
