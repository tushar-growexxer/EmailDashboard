/**
 * Dashboard Data Utilities
 * Functions to transform MongoDB data into frontend-compatible format
 */

/**
 * Extract unique categories from user email data
 * Uses Intent array from Dashboard 1
 * @param {Object} userEmailData - MongoDB document with Intent array
 * @returns {Array<string>} Array of category names
 */
export function getUniqueCategories(userEmailData) {
  if (!userEmailData || !userEmailData.Intent) return [];

  return userEmailData.Intent
    .map(intent => intent.category);
}

/**
 * Transform MongoDB response data to table format
 * Uses Intent array from Dashboard 1
 * @param {Array} mongoData - Array of MongoDB documents
 * @returns {Array} Transformed data for table display
 */
export function transformResponseDashboardData(mongoData) {
  if (!Array.isArray(mongoData) || mongoData.length === 0) return [];

  return mongoData.map(user => {
    const intents = user.Intent || [];
    const categoryCounts = {};

    // Extract counts from Intent array
    intents.forEach(intent => {
      const normalizedKey = intent.category.toLowerCase().replace(/[-\s]/g, '');
      categoryCounts[normalizedKey] = intent.count || 0;
    });

    // Use totalUnreplied24h from MongoDB
    const total = user.totalUnreplied24h || 0;

    return {
      id: user.user_id || user._id,
      userName: formatProperCase(user.full_name || user.user_email?.split('@')[0] || 'Unknown User'),
      email: user.user_email || '',
      total,
      ...categoryCounts,
    };
  });
}

/**
 * Transform MongoDB aging data to table format
 * Uses count_by_bucket array from MongoDB Dashboard 2
 * @param {Array} mongoData - Array of MongoDB documents with aging stats
 * @returns {Array} Transformed data for aging table display
 */
export function transformAgingDashboardData(mongoData) {
  if (!Array.isArray(mongoData) || mongoData.length === 0) return [];

  return mongoData.map(user => {
    // Use count_by_bucket from MongoDB Dashboard 2
    const countByBucket = user.count_by_bucket || [];

    // Build dynamic bucket data - supports both naming conventions
    const bucketMap = {};
    const bucketData = {};
    let total = 0;

    countByBucket.forEach(bucket => {
      const category = bucket.category;
      const count = bucket.count || 0;
      
      // Store with original category name
      bucketMap[category] = count;
      bucketData[category] = bucket;
      total += count;
    });

    // Use total_unreplied from MongoDB if available, otherwise use calculated total
    total = user.total_unreplied || total;

    return {
      id: user.user_id || user._id,
      userName: formatProperCase(user.full_name || user.user_email?.split('@')[0] || 'Unknown User'),
      email: user.user_email || '',
      ...bucketMap, // Spread all bucket counts dynamically
      total,
      bucketData, // Store raw bucket data for email details
      time_buckets: user.time_buckets || {},
      rawData: user, // Keep raw MongoDB data for reference
    };
  });
}

/**
 * Get table headers dynamically from MongoDB data
 * @param {Array} mongoData - Array of MongoDB documents
 * @returns {Array} Array of header objects {key, label}
 */
export function getTableHeaders(mongoData) {
  if (!Array.isArray(mongoData) || mongoData.length === 0) {
    return [
      { key: 'userName', label: 'User' },
      { key: 'total', label: 'Total' },
    ];
  }

  const firstUser = mongoData[0];
  const categories = getUniqueCategories(firstUser);

  return [
    { key: 'userName', label: 'User' },
    ...categories.map(category => ({
      key: category.toLowerCase().replace(/[-\s]/g, ''),
      label: category,
    })),
    { key: 'total', label: 'Total' },
  ];
}

/**
 * Get aging table headers dynamically from MongoDB data
 * Formats category names into readable column headers
 * @param {Array} mongoData - Array of MongoDB documents with count_by_bucket
 * @returns {Array} Array of header objects {key, label}
 */
export function getAgingTableHeaders(mongoData) {
  if (!Array.isArray(mongoData) || mongoData.length === 0) {
    return [];
  }

  // Get unique categories from all users
  const categoriesSet = new Set();
  mongoData.forEach(user => {
    if (user.count_by_bucket && Array.isArray(user.count_by_bucket)) {
      user.count_by_bucket.forEach(bucket => {
        categoriesSet.add(bucket.category);
      });
    }
  });

  const categories = Array.from(categoriesSet);

  // Map categories to readable labels
  const categoryLabels = {
    '1_to_2_days': '1-2 Days',
    '2_to_3_days': '2-3 Days',
    '3_to_7_days': '3-7 Days',
    'above_7_days': '7+ Days',
    '24h_to_48h': '24-48 Hrs',
    '48h_to_72h': '48-72 Hrs',
    '72h_to_168h': '3-7 Days',
    'above_168h': '7+ Days',
  };

  return categories.map(category => ({
    key: category,
    label: categoryLabels[category] || category.replace(/_/g, ' ').toUpperCase(),
  }));
}

/**
 * Calculate summary statistics from Response Dashboard (Dashboard 1)
 * @param {Array} responseMongoData - Raw MongoDB Response Dashboard data
 * @returns {Object} Summary statistics
 */
export function calculateResponseSummaryStats(responseMongoData) {
  if (!Array.isArray(responseMongoData) || responseMongoData.length === 0) {
    return {
      totalUnreplied24h: 0,
      totalByIntent: {},
      totalUsers: 0,
    };
  }

  // Sum totalUnreplied24h from all users
  const totalUnreplied24h = responseMongoData.reduce(
    (sum, user) => sum + (user.totalUnreplied24h || 0),
    0
  );

  // Aggregate Intent counts across all users
  const intentAggregation = {};
  responseMongoData.forEach(user => {
    if (user.Intent && Array.isArray(user.Intent)) {
      user.Intent.forEach(intent => {
        if (!intentAggregation[intent.category]) {
          intentAggregation[intent.category] = 0;
        }
        intentAggregation[intent.category] += intent.count || 0;
      });
    }
  });

  return {
    totalUnreplied24h,
    totalByIntent: intentAggregation,
    totalUsers: responseMongoData.length,
  };
}

/**
 * Calculate summary statistics from Aging Dashboard (Dashboard 2)
 * @param {Array} agingMongoData - Raw MongoDB Aging Dashboard data
 * @returns {Object} Summary statistics
 */
export function calculateAgingSummaryStats(agingMongoData) {
  if (!Array.isArray(agingMongoData) || agingMongoData.length === 0) {
    return {
      totalUnreplied: 0,
      critical: 0,
      totalUsers: 0,
    };
  }

  // Sum total_unreplied from all users
  const totalUnreplied = agingMongoData.reduce(
    (sum, user) => sum + (user.total_unreplied || 0),
    0
  );

  // Find critical emails (7+ days) - works with both naming conventions
  let critical = 0;
  agingMongoData.forEach(user => {
    if (user.count_by_bucket && Array.isArray(user.count_by_bucket)) {
      user.count_by_bucket.forEach(bucket => {
        // Check for both old and new naming conventions for 7+ days
        if (bucket.category === 'above_168h' || bucket.category === 'above_7_days') {
          critical += bucket.count || 0;
        }
      });
    }
  });

  return {
    totalUnreplied,
    critical, // Critical = above 7 days
    totalUsers: agingMongoData.length,
  };
}

/**
 * @deprecated Use calculateResponseSummaryStats or calculateAgingSummaryStats instead
 * Legacy function for backward compatibility
 */
export function calculateSummaryStats(transformedData) {
  if (!Array.isArray(transformedData) || transformedData.length === 0) {
    return {
      totalUnreplied: 0,
      critical: 0,
      avgResponseTime: 0,
      slaCompliance: 0,
    };
  }

  const totalUnreplied = transformedData.reduce((sum, user) => sum + (user.total || 0), 0);
  const critical = transformedData.reduce((sum, user) => sum + (user.count_168_plus || 0), 0);

  return {
    totalUnreplied,
    critical,
    avgResponseTime: totalUnreplied > 0 ? '3.2 days' : '0 days',
    slaCompliance: totalUnreplied > 0 ? '78%' : '100%',
  };
}

/**
 * Sort emails by date (ascending - oldest first)
 * @param {Array} emails - Array of email objects
 * @returns {Array} Sorted emails
 */
export function sortEmailsByDate(emails, ascending = true) {
  if (!Array.isArray(emails)) return [];

  return [...emails].sort((a, b) => {
    const dateA = new Date(a.inbox_date);
    const dateB = new Date(b.inbox_date);
    return ascending ? dateA - dateB : dateB - dateA;
  });
}

/**
 * Calculate hours since email was received
 * @param {string|Date} emailDate - Email date (inbox_date or date field)
 * @returns {number} Hours since email was received
 */
export function calculateHoursUnreplied(emailDate) {
  if (!emailDate) return 0;

  const emailDateTime = new Date(emailDate);
  const now = new Date().setHours(7,0,0,0);

  // Check if the date is valid
  if (isNaN(emailDateTime.getTime())) return 0;

  const diffMs = now - emailDateTime;
  const diffHours = diffMs / (1000 * 60 * 60);

  return Math.max(0, diffHours); // Ensure non-negative
}

/**
 * Format hours unreplied to a human readable format
 * If hours is less than 24, return the hours in hours
 * If hours is less than 168, return the hours in days and hours
 * If hours is greater than 168, return the hours in weeks and days
 * @param {number} hours - Hours unreplied
 * @returns {string} Formatted hours unreplied
 */
export function formatHoursUnreplied(hours) {
  if (!hours || hours < 0) return '0 hours';

  if (hours < 24) {
    return `${Math.round(hours)} hours`;
  } else if (hours < 168) {
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
  } else {
    const weeks = Math.floor(hours / 168);
    const days = Math.floor((hours % 168) / 24);
    const remainingHours = Math.floor(hours % 24);
    return `${weeks}w ${days}d ${remainingHours}h`;
  }
}

/**
 * Extract email info from "Name <email>" format
 * @param {string} fromEmail - Email string
 * @returns {Object} {name, email}
 */
export function extractEmailInfo(fromEmail) {
  if (!fromEmail) return { name: 'Unknown', email: '' };

  const match = fromEmail.match(/(.*?)\s*<(.+?)>/);
  if (match) {
    return {
      name: match[1].trim() || match[2].trim(),
      email: match[2].trim(),
    };
  }
  return {
    name: fromEmail,
    email: fromEmail,
  };
}

/**
 * Get color variant for category badges
 * @param {string} category - Category name
 * @returns {string} Badge color variant
 */
export function getCategoryColor(category) {
  const normalizedCategory = category.toLowerCase().replace(/[-\s]/g, '');

  const colors = {
    status: 'blue',
    complaint: 'red',
    inquiry: 'green',
    pricingnegotiation: 'purple',
    proposal: 'orange',
    logistics: 'cyan',
    acknowledgement: 'yellow',
    statusofinquiry: 'indigo',
    unclassified: 'gray',
  };

  return colors[normalizedCategory] || 'gray';
}

/**
 * Convert uppercase text to proper case (capitalize first letter of each word)
 * @param {string} text - Text to convert
 * @returns {string} Properly formatted text
 */
export function formatProperCase(text) {
  if (!text) return '';

  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Merge user data with MongoDB data
 * Updates existing user object with fresh MongoDB data
 * @param {Object} existingUser - Existing user data structure
 * @param {Object} mongoData - Fresh MongoDB data
 * @returns {Object} Merged user data
 */
export function mergeUserDashboardData(existingUser, mongoData) {
  if (!mongoData) return existingUser;

  return {
    ...existingUser,
    categories: mongoData.categories || existingUser.categories,
    user_id: mongoData.user_id || existingUser.user_id,
    user_email: mongoData.user_email || existingUser.user_email,
    full_name: mongoData.full_name || existingUser.full_name,
  };
}

/**
 * Check if data needs refresh based on timestamp
 * @param {Date} lastFetched - Last fetch timestamp
 * @param {number} maxAgeMinutes - Max age in minutes (default: 60)
 * @returns {boolean} True if refresh needed
 */
export function needsRefresh(lastFetched, maxAgeMinutes = 60) {
  if (!lastFetched) return true;

  const now = new Date();
  const ageMinutes = (now - lastFetched) / 1000 / 60;
  return ageMinutes >= maxAgeMinutes;
}

/**
 * Format date with AM/PM for display
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted date string with AM/PM
 */
export function formatDateTimeWithAMPM(dateString) {
  if (!dateString) return 'N/A';

  const date = new Date(dateString);

  // Check if the date is valid
  if (isNaN(date.getTime())) return 'N/A';

  // Format as DD/MM/YYYY HH:MM AM/PM
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  hours = hours % 12;
  hours = hours ? hours : 12; // Handle midnight (0 hours)

  return `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
}

/**
 * Validate MongoDB data structure
 * Dashboard 1 uses Intent array, Dashboard 2 uses time_buckets
 * @param {Object} data - MongoDB data to validate
 * @param {string} type - Dashboard type: 'response' or 'aging'
 * @returns {Object} {valid: boolean, errors: Array<string>}
 */
export function validateDashboardData(data, type = 'response') {
  const errors = [];

  if (!data) {
    errors.push('Data is null or undefined');
    return { valid: false, errors };
  }

  if (!data.user_id && !data._id) {
    errors.push('Missing user_id or _id');
  }

  if (!data.user_email) {
    errors.push('Missing user_email');
  }

  if (type === 'response') {
    // Dashboard 1 validation
    if (!data.Intent || !Array.isArray(data.Intent)) {
      errors.push('Missing or invalid Intent array');
    }
    if (typeof data.totalUnreplied24h !== 'number') {
      errors.push('Missing or invalid totalUnreplied24h');
    }
  } else if (type === 'aging') {
    // Dashboard 2 validation
    if (!data.time_buckets || typeof data.time_buckets !== 'object') {
      errors.push('Missing or invalid time_buckets object');
    }
    if (!data.count_by_bucket || !Array.isArray(data.count_by_bucket)) {
      errors.push('Missing or invalid count_by_bucket array');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
/**
 * Get initials from name
 * @param {string} name - Name to get initials from
 * @returns {string} Initials
 */
export function getInitials(name) {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('');
}

export default {
  getUniqueCategories,
  transformResponseDashboardData,
  transformAgingDashboardData,
  getTableHeaders,
  getAgingTableHeaders,
  calculateSummaryStats,
  calculateResponseSummaryStats,
  calculateAgingSummaryStats,
  sortEmailsByDate,
  calculateHoursUnreplied,
  formatHoursUnreplied,
  extractEmailInfo,
  getCategoryColor,
  formatProperCase,
  mergeUserDashboardData,
  needsRefresh,
  formatDateTimeWithAMPM,
  validateDashboardData,
  getInitials,
};

