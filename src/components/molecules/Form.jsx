import React from 'react';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Textarea from '../atoms/Textarea';
import Select from '../atoms/Select';

const Form = ({
  children,
  onSubmit,
  loading = false,
  submitDisabled = false,
  submitText = 'Simpan',
  submitVariant = 'primary',
  className = '',
  ...props
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && !loading) {
      onSubmit(e);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className={`space-y-6 ${className}`} 
      {...props}
    >
      {children}
      
      <div className="flex justify-end space-x-3">
        <Button
          type="submit"
          variant={submitVariant}
          loading={loading}
          disabled={loading || submitDisabled}
        >
          {submitText}
        </Button>
      </div>
    </form>
  );
};

// Form Field Component
Form.Field = ({ children, className = '', ...props }) => (
  <div className={`form-control ${className}`} {...props}>
    {children}
  </div>
);

// Form Row Component for horizontal layout
Form.Row = ({ children, className = '', ...props }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`} {...props}>
    {children}
  </div>
);

// Form Section Component
Form.Section = ({ title, children, className = '', ...props }) => (
  <div className={`space-y-4 ${className}`} {...props}>
    {title && (
      <h3 className="text-lg font-semibold text-base-content">{title}</h3>
    )}
    {children}
  </div>
);

// Export individual form components for convenience
Form.Input = Input;
Form.Textarea = Textarea;
Form.Select = Select;

export default Form;
