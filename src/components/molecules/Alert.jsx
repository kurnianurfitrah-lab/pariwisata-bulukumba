import React from 'react';
import Button from '../atoms/Button';

const Alert = ({
  type = 'info',
  title,
  children,
  onClose,
  showIcon = true,
  className = '',
  ...props
}) => {
  const alertConfig = {
    info: {
      icon: 'ℹ️',
      classes: 'alert-info',
      bgColor: 'bg-info/10',
      borderColor: 'border-info/20',
      textColor: 'text-info'
    },
    success: {
      icon: '✅',
      classes: 'alert-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      textColor: 'text-success'
    },
    warning: {
      icon: '⚠️',
      classes: 'alert-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20',
      textColor: 'text-warning'
    },
    error: {
      icon: '❌',
      classes: 'alert-error',
      bgColor: 'bg-error/10',
      borderColor: 'border-error/20',
      textColor: 'text-error'
    }
  };

  const config = alertConfig[type] || alertConfig.info;

  const alertClasses = [
    'alert',
    config.classes,
    config.bgColor,
    config.borderColor,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={alertClasses} {...props}>
      {showIcon && (
        <div className="flex-shrink-0">
          <span className="text-lg">{config.icon}</span>
        </div>
      )}
      
      <div className="flex-1">
        {title && (
          <h3 className={`font-semibold ${config.textColor}`}>{title}</h3>
        )}
        <div className="text-base-content/80">{children}</div>
      </div>
      
      {onClose && (
        <div className="flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="btn-circle btn-sm"
          >
            ✕
          </Button>
        </div>
      )}
    </div>
  );
};

// Alert Success Component
Alert.Success = ({ title, children, ...props }) => (
  <Alert type="success" title={title} {...props}>
    {children}
  </Alert>
);

// Alert Error Component
Alert.Error = ({ title, children, ...props }) => (
  <Alert type="error" title={title} {...props}>
    {children}
  </Alert>
);

// Alert Warning Component
Alert.Warning = ({ title, children, ...props }) => (
  <Alert type="warning" title={title} {...props}>
    {children}
  </Alert>
);

// Alert Info Component
Alert.Info = ({ title, children, ...props }) => (
  <Alert type="info" title={title} {...props}>
    {children}
  </Alert>
);

export default Alert;
