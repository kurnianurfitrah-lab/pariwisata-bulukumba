import React, { useEffect } from 'react';
import Button from '../atoms/Button';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'modal-box w-11/12 max-w-md',
    md: 'modal-box w-11/12 max-w-lg',
    lg: 'modal-box w-11/12 max-w-2xl',
    xl: 'modal-box w-11/12 max-w-4xl',
    full: 'modal-box w-11/12 max-w-full'
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <dialog 
      className={`modal ${isOpen ? 'modal-open' : ''}`}
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        border: 'none',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999
      }}
      {...props}
    >
      <div className={`${sizes[size] || sizes.md} ${className}`}>
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between pb-4">
            {title && (
              <h3 className="text-lg font-bold">{title}</h3>
            )}
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="btn-circle btn-sm"
              >
                ✕
              </Button>
            )}
          </div>
        )}
        
        <div className="pt-4">
          {children}
        </div>
      </div>
    </dialog>
  );
};

// Modal Footer Component
Modal.Footer = ({ children, className = '', ...props }) => (
  <div className={`flex justify-end space-x-3 pt-4 ${className}`} {...props}>
    {children}
  </div>
);

// Confirm Modal Component
Modal.Confirm = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin?',
  confirmText = 'Ya',
  cancelText = 'Tidak',
  variant = 'error',
  loading = false,
  ...props
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      {...props}
    >
      <div className="space-y-4">
        <p className="text-base-content/80">{message}</p>
        
        <Modal.Footer>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelText}
          </Button>
          <Button 
            variant={variant} 
            onClick={handleConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmText}
          </Button>
        </Modal.Footer>
      </div>
    </Modal>
  );
};

export default Modal;
