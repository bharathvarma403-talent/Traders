/**
 * Shared formatting utilities used across dashboard pages.
 */

/**
 * Returns inline styles for reservation status badges.
 * @param {string} status - One of: Pending, Accepted, Rejected, Completed
 */
export const getStatusStyles = (status) => {
  if (status === 'Accepted') {
    return {
      background: 'rgba(34,197,94,0.12)',
      border: '1px solid rgba(34,197,94,0.24)',
      color: '#86efac',
    };
  }

  if (status === 'Rejected') {
    return {
      background: 'rgba(248,113,113,0.12)',
      border: '1px solid rgba(248,113,113,0.24)',
      color: '#fca5a5',
    };
  }

  if (status === 'Completed') {
    return {
      background: 'rgba(59,130,246,0.12)',
      border: '1px solid rgba(59,130,246,0.24)',
      color: '#93c5fd',
    };
  }

  // Default: Pending
  return {
    background: 'rgba(250,204,21,0.12)',
    border: '1px solid rgba(250,204,21,0.24)',
    color: '#fde68a',
  };
};

/**
 * Formats a date value into a human-readable locale string (en-IN).
 * @param {string|Date} value - ISO date string or Date object
 * @param {boolean} withTime - Include time in output
 * @returns {string}
 */
export const formatDate = (value, withTime = false) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString(
    'en-IN',
    withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }
  );
};
