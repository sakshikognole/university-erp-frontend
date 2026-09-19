/**
 * PmStepIndicator.jsx
 *
 * Reusable step indicator bar for the Password Management module.
 * Matches the existing step-indicator-bar styling used in ForgotPassword.jsx.
 *
 * Props:
 *   steps   â-- string[]  e.g. ['Setup', 'OTP', 'Done']
 *   current â-- number    1-based index of the active step
 */

import React from 'react';

const PmStepIndicator = ({ steps, current }) => {
  return (
    <div className="step-indicator-bar" role="list" aria-label="Progress steps">
      {steps.map((label, idx) => {
        const stepNumber = idx + 1;
        const isActive = stepNumber <= current;
        return (
          <React.Fragment key={label}>
            <div
              className={`step-item ${isActive ? 'active' : ''}`}
              role="listitem"
              aria-current={stepNumber === current ? 'step' : undefined}
            >
              <span className="step-number">{stepNumber}</span>
              <span className="step-text">{label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`step-line ${isActive ? 'active' : ''}`} aria-hidden="true" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default PmStepIndicator;
