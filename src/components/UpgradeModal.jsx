import PropTypes from 'prop-types';
import { useEffect, useRef } from 'react';

/**
 * UpgradeModal Component
 * Modal dialog for upgrading to Pro plan
 */
function UpgradeModal({ isOpen, onClose, onUpgrade, freeLimit }) {
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const upgradeButtonRef = useRef(null);

  // Focus trap and escape handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the modal when opened
    closeButtonRef.current?.focus();

    const handleKeyDown = (e) => {
      // Close on escape
      if (e.key === 'Escape') {
        onClose();
      }
      
      // Focus trap
      if (e.key === 'Tab') {
        const focusableElements = modalRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements?.length) {
          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];
          
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="upgrade-modal-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div 
        ref={modalRef}
        className="upgrade-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        aria-describedby="upgrade-modal-description"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="upgrade-content">
          <h2 id="upgrade-modal-title">Upgrade to Pro</h2>
          <p id="upgrade-modal-description">
            You've reached the free limit of {freeLimit} recipe searches.
          </p>
          
          <div className="upgrade-features">
            <ul>
              <li>✨ Unlimited recipe generations</li>
              <li>🎯 Exclusive Pro recipes</li>
              <li>💾 Save unlimited favorites</li>
              <li>🚀 Priority support</li>
            </ul>
          </div>
          
          <div className="upgrade-actions">
            <button 
              ref={upgradeButtonRef}
              id="upgrade-btn" 
              onClick={onUpgrade}
              className="btn-upgrade-modal"
            >
              Upgrade Now
            </button>
            <button 
              ref={closeButtonRef}
              id="close-upgrade" 
              onClick={onClose}
              className="btn-cancel-modal"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

UpgradeModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onUpgrade: PropTypes.func.isRequired,
  freeLimit: PropTypes.number.isRequired
};

export default UpgradeModal;
