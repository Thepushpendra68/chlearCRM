/**
 * Natural Language Date Parser
 * Converts natural language date expressions to ISO date strings
 */

class DateParser {
  /**
   * Parse natural language date expression
   * Returns { from, to } with ISO date strings (YYYY-MM-DD)
   */
  static parseNaturalDate(dateExpression) {
    if (!dateExpression || typeof dateExpression !== 'string') {
      return null;
    }

    const expr = dateExpression.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Last N days
    const lastDaysMatch = expr.match(/last\s+(\d+)\s+days?/);
    if (lastDaysMatch) {
      const days = parseInt(lastDaysMatch[1]);
      const from = new Date(today);
      from.setDate(from.getDate() - days);
      return { from: this.formatDate(from), to: this.formatDate(today) };
    }

    // Last week
    if (expr.includes('last week')) {
      const from = new Date(today);
      from.setDate(from.getDate() - 7);
      return { from: this.formatDate(from), to: this.formatDate(today) };
    }

    // This week
    if (expr.includes('this week')) {
      const from = new Date(today);
      const day = from.getDay();
      from.setDate(from.getDate() - day); // Start from Sunday
      return { from: this.formatDate(from), to: this.formatDate(today) };
    }

    // Last month
    if (expr.includes('last month')) {
      const from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const to = new Date(today.getFullYear(), today.getMonth(), 0);
      return { from: this.formatDate(from), to: this.formatDate(to) };
    }

    // This month
    if (expr.includes('this month')) {
      const from = new Date(today.getFullYear(), today.getMonth(), 1);
      return { from: this.formatDate(from), to: this.formatDate(today) };
    }

    // Last quarter (3 months)
    if (expr.includes('last quarter')) {
      const from = new Date(today);
      from.setMonth(from.getMonth() - 3);
      return { from: this.formatDate(from), to: this.formatDate(today) };
    }

    // This quarter
    if (expr.includes('this quarter')) {
      const currentQuarter = Math.floor(today.getMonth() / 3);
      const from = new Date(today.getFullYear(), currentQuarter * 3, 1);
      return { from: this.formatDate(from), to: this.formatDate(today) };
    }

    // Last year
    if (expr.includes('last year')) {
      const from = new Date(today.getFullYear() - 1, 0, 1);
      const to = new Date(today.getFullYear() - 1, 11, 31);
      return { from: this.formatDate(from), to: this.formatDate(to) };
    }

    // This year
    if (expr.includes('this year')) {
      const from = new Date(today.getFullYear(), 0, 1);
      return { from: this.formatDate(from), to: this.formatDate(today) };
    }

    // Since [date]
    const sinceMatch = expr.match(/since\s+(.+)/);
    if (sinceMatch) {
      const fromDate = this.parseDate(sinceMatch[1]);
      if (fromDate) {
        return { from: this.formatDate(fromDate), to: this.formatDate(today) };
      }
    }

    // Between [date1] and [date2]
    const betweenMatch = expr.match(/between\s+(.+?)\s+and\s+(.+)/);
    if (betweenMatch) {
      const from = this.parseDate(betweenMatch[1]);
      const to = this.parseDate(betweenMatch[2]);
      if (from && to) {
        return { from: this.formatDate(from), to: this.formatDate(to) };
      }
    }

    // Try to parse as specific date (YYYY-MM-DD, MM/DD/YYYY, etc)
    const singleDate = this.parseDate(expr);
    if (singleDate) {
      return { from: this.formatDate(singleDate), to: this.formatDate(singleDate) };
    }

    return null;
  }

  /**
   * Parse various date formats
   */
  static parseDate(dateStr) {
    if (!dateStr) return null;

    const str = dateStr.trim();

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
      const date = new Date(str);
      if (!isNaN(date.getTime())) return date;
    }

    // MM/DD/YYYY or MM-DD-YYYY
    const mdy = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (mdy) {
      const date = new Date(parseInt(mdy[3]), parseInt(mdy[1]) - 1, parseInt(mdy[2]));
      if (!isNaN(date.getTime())) return date;
    }

    // DD/MM/YYYY or DD-MM-YYYY (assuming non-US format in last resort)
    const dmy = str.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
    if (dmy && parseInt(dmy[1]) > 12) { // If first number > 12, must be day
      const date = new Date(parseInt(dmy[3]), parseInt(dmy[2]) - 1, parseInt(dmy[1]));
      if (!isNaN(date.getTime())) return date;
    }

    return null;
  }

  /**
   * Parse deal value range
   * Examples: "over 50000", "under 25000", "between 10000 and 100000"
   */
  static parseDealValueRange(valueExpression) {
    if (!valueExpression || typeof valueExpression !== 'string') {
      return null;
    }

    const expr = valueExpression.toLowerCase().trim();

    // Over/above/more than
    const overMatch = expr.match(/(?:over|above|more than)\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)/);
    if (overMatch) {
      const value = parseFloat(overMatch[1].replace(/,/g, ''));
      return { min: value };
    }

    // Under/below/less than
    const underMatch = expr.match(/(?:under|below|less than)\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)/);
    if (underMatch) {
      const value = parseFloat(underMatch[1].replace(/,/g, ''));
      return { max: value };
    }

    // Between X and Y
    const betweenMatch = expr.match(/between\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s+and\s+\$?(\d+(?:,\d{3})*(?:\.\d+)?)/);
    if (betweenMatch) {
      const min = parseFloat(betweenMatch[1].replace(/,/g, ''));
      const max = parseFloat(betweenMatch[2].replace(/,/g, ''));
      return { min, max };
    }

    // Single value (equals)
    const singleMatch = expr.match(/^\$?(\d+(?:,\d{3})*(?:\.\d+)?)$/);
    if (singleMatch) {
      const value = parseFloat(singleMatch[1].replace(/,/g, ''));
      return { min: value, max: value };
    }

    return null;
  }

  /**
   * Format date as YYYY-MM-DD
   */
  static formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Extract date-related keywords from message
   */
  static extractDateKeywords(message) {
    const keywords = [];
    const msg = message.toLowerCase();

    if (msg.includes('last')) keywords.push('last');
    if (msg.includes('this')) keywords.push('this');
    if (msg.includes('week')) keywords.push('week');
    if (msg.includes('month')) keywords.push('month');
    if (msg.includes('quarter')) keywords.push('quarter');
    if (msg.includes('year')) keywords.push('year');
    if (msg.includes('day')) keywords.push('day');
    if (msg.includes('since')) keywords.push('since');
    if (msg.includes('between')) keywords.push('between');
    if (msg.includes('range')) keywords.push('range');

    return keywords;
  }

  /**
   * Extract value-related keywords from message
   */
  static extractValueKeywords(message) {
    const keywords = [];
    const msg = message.toLowerCase();

    if (msg.match(/\$?\d+(?:,\d{3})*k(?:\b|$)/i)) keywords.push('value_k');
    if (msg.match(/\$?\d+(?:,\d{3})*(?:\b|$)/)) keywords.push('value');
    if (msg.includes('over') || msg.includes('above')) keywords.push('over');
    if (msg.includes('under') || msg.includes('below')) keywords.push('under');
    if (msg.includes('between')) keywords.push('between');
    if (msg.includes('deal') || msg.includes('value')) keywords.push('deal_value');

    return keywords;
  }
}

module.exports = DateParser;
