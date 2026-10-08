import React, { useRef, useEffect } from 'react';
import { A11ySemanticEngine } from './A11ySemanticEngine';

export interface A11yProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-hidden'?: boolean;
  role?: string;
  tabIndex?: number;
}

/**
 * HOC that enforces WCAG 2.1 AAA compliance by strictly checking ARIA tags
 * and managing appropriate semantic roles.
 */
export function withA11y<P extends object, T = unknown>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string = WrappedComponent.displayName || WrappedComponent.name || 'Component'
) {
  const Component = WrappedComponent as React.ElementType;
  return React.forwardRef<T, P & A11yProps>((props, ref) => {
    // Run real-time semantic enforcement
    A11ySemanticEngine.enforceAria(props, componentName);
    return <Component ref={ref} {...props} />;
  });
}

interface FocusTrapProps {
  children: React.ReactNode;
  isActive?: boolean;
  className?: string;
}

/**
 * Creates a keyboard-only navigation loop to trap focus inside a specific
 * container, such as a checkout modal, ensuring screen reader and keyboard
 * users can navigate seamlessly.
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({ children, isActive = true, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;
    
    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input[type="text"]:not([disabled]), input[type="radio"]:not([disabled]), input[type="checkbox"]:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    // Focus the first element when activated
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return <div ref={containerRef} className={className}>{children}</div>;
};
