
import React from 'react';

export const MonetizationIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="8" />
    <line x1="4" y1="4" x2="20" y2="20" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);
