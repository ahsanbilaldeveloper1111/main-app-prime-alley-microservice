'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Pages/routes to exclude from capitalization
const EXCLUDED_ROUTES = [
  '/auth/signin',
  '/auth/login',
  '/auth/change-password',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/pages/login',
  '/pages/signin',
  '/pages/change-password',
  '/pages/forgot-password',
];

const GlobalInputCapitalization = () => {
  const router = useRouter();

  useEffect(() => {
    // Check if current route should be excluded
    const currentPath = router.pathname || globalThis.location?.pathname || '';
    const shouldExclude = EXCLUDED_ROUTES.some(route => 
      currentPath.includes(route) || currentPath === route
    );

    if (shouldExclude) {
      return; // Don't apply capitalization on excluded routes
    }

    // Function to capitalize first letter
    const capitalizeFirstLetter = (value: string): string => {
      if (!value || value.length === 0) return value;
      return value.charAt(0).toUpperCase() + value.slice(1);
    };

    // Handler function for input events
    const handleInputCapitalization = (e: Event) => {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      if (!target) return;

      // Skip if the input has a data attribute to exclude it
      if (target.dataset.noCapitalize !== undefined) {
        return;
      }

      // Only process text inputs and textareas
      const isTextInput = target.tagName === 'INPUT' && 
        (target.type === 'text' || target.type === 'email' || !target.type);
      const isTextarea = target.tagName === 'TEXTAREA';

      if (!isTextInput && !isTextarea) {
        return;
      }

      const currentValue = target.value || '';

      // Remove leading whitespace and capitalize first letter
      let processedValue = currentValue.trimStart();
      if (processedValue.length > 0) {
        processedValue = capitalizeFirstLetter(processedValue);
      }

      // Only update if the value needs to be changed
      if (currentValue !== processedValue) {
        const cursorPosition = target.selectionStart || 0;
        const originalLength = currentValue.length;
        const newLength = processedValue.length;
        const lengthDiff = newLength - originalLength;

        // Update the value directly
        target.value = processedValue;

        // Adjust cursor position based on length difference (accounting for removed leading spaces)
        const newCursorPosition = Math.max(0, cursorPosition + lengthDiff);
        if (target.setSelectionRange) {
          target.setSelectionRange(newCursorPosition, newCursorPosition);
        }

        // Create and dispatch a change event to trigger React's onChange
        const changeEvent = new Event('change', { bubbles: true });
        target.dispatchEvent(changeEvent);

        // Also dispatch input event for compatibility
        const inputEvent = new Event('input', { bubbles: true });
        target.dispatchEvent(inputEvent);
      }
    };

    // Attach event listener to document for global coverage
    document.addEventListener('input', handleInputCapitalization, true);

    // Cleanup
    return () => {
      document.removeEventListener('input', handleInputCapitalization, true);
    };
  }, [router.pathname]);

  return null; // This component doesn't render anything
};

export default GlobalInputCapitalization;
