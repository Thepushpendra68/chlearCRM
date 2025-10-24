import React from 'react';
import { useIndustryConfig } from '../../context/IndustryConfigContext';

/**
 * TermLabel Component
 *
 * Displays industry-specific terminology instead of hardcoded labels.
 * Automatically adapts based on the company's industry configuration.
 *
 * Examples:
 *   Generic CRM:  <TermLabel term="lead" /> → "Lead"
 *   School CRM:   <TermLabel term="lead" /> → "Prospective Student"
 *
 *   Generic CRM:  <TermLabel term="lead" plural /> → "Leads"
 *   School CRM:   <TermLabel term="lead" plural /> → "Prospective Students"
 *
 * @param {string} term - The base term key (e.g., 'lead', 'contact', 'deal')
 * @param {boolean} plural - Whether to use plural form
 * @param {string} className - Additional CSS classes
 * @param {string} fallback - Fallback text if term not found
 */
const TermLabel = ({
  term,
  plural = false,
  className = '',
  fallback = null
}) => {
  const { getTerminology, loading } = useIndustryConfig();

  // While configuration is loading, show the term key or fallback
  if (loading) {
    const displayText = fallback || (plural ? `${term}s` : term);
    return <span className={className}>{displayText}</span>;
  }

  // Get the industry-specific term
  // If plural is requested, try to get the plural form first, otherwise append 's'
  const termKey = plural ? `${term}s` : term;
  const label = getTerminology(termKey, fallback);

  return (
    <span className={className}>
      {label || fallback || term}
    </span>
  );
};

export default TermLabel;
