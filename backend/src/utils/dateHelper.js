/**
 * Convert ISO datetime string to MySQL datetime format
 * @param {string} isoString - ISO datetime string (e.g., '2025-11-26T18:15:07.678Z')
 * @returns {string} MySQL datetime format (e.g., '2025-11-26 18:15:07')
 */
const formatDateForMySQL = (isoString) => {
    if (!isoString) return null;
    const date = new Date(isoString);
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

/**
 * Convert MySQL datetime to ISO string
 * @param {string} mysqlDateTime - MySQL datetime format
 * @returns {string} ISO datetime string
 */
const formatDateFromMySQL = (mysqlDateTime) => {
    if (!mysqlDateTime) return null;
    return new Date(mysqlDateTime).toISOString();
};

module.exports = {
    formatDateForMySQL,
    formatDateFromMySQL
};
