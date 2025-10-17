const { parseDateFlexible } = require('../services/importValidationEngine');

describe('parseDateFlexible - Date Parser', () => {
  
  test('ISO format: YYYY-MM-DD', () => {
    const result = parseDateFlexible('2025-10-17');
    expect(result).not.toBeNull();
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(9);
    expect(result.getDate()).toBe(17);
  });

  test('US format with slashes: MM/DD/YYYY', () => {
    const result = parseDateFlexible('10/17/2025');
    expect(result).not.toBeNull();
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(9);
    expect(result.getDate()).toBe(17);
  });

  test('US format with dashes: MM-DD-YYYY', () => {
    const result = parseDateFlexible('10-17-2025');
    expect(result).not.toBeNull();
  });

  test('European format when day > 12: DD/MM/YYYY', () => {
    const result = parseDateFlexible('17/10/2025');
    expect(result).not.toBeNull();
    expect(result.getDate()).toBe(17);
    expect(result.getMonth()).toBe(9);
  });

  test('Text month format: Oct 17, 2025', () => {
    const result = parseDateFlexible('Oct 17, 2025');
    expect(result).not.toBeNull();
    expect(result.getMonth()).toBe(9);
  });

  test('Excel serial number', () => {
    const result = parseDateFlexible('45573');
    expect(result).not.toBeNull();
  });

  test('Reject empty string', () => {
    expect(parseDateFlexible('')).toBeNull();
  });

  test('Reject null', () => {
    expect(parseDateFlexible(null)).toBeNull();
  });

  test('Reject undefined', () => {
    expect(parseDateFlexible(undefined)).toBeNull();
  });

  test('Reject invalid date: Feb 31', () => {
    expect(parseDateFlexible('02/31/2025')).toBeNull();
  });

  test('Reject invalid month: 13', () => {
    expect(parseDateFlexible('2025-13-01')).toBeNull();
  });

  test('Reject completely invalid string', () => {
    expect(parseDateFlexible('not a date')).toBeNull();
  });

  test('Accept valid Date object', () => {
    const date = new Date('2025-10-17');
    const result = parseDateFlexible(date);
    expect(result).not.toBeNull();
  });

  test('Handle whitespace', () => {
    const result = parseDateFlexible('  2025-10-17  ');
    expect(result).not.toBeNull();
  });

  test('Parse single-digit month/day', () => {
    const result = parseDateFlexible('1/5/2025');
    expect(result).not.toBeNull();
    expect(result.getMonth()).toBe(0);
  });

  test('Real-world: US import 3/15/2025', () => {
    const result = parseDateFlexible('3/15/2025');
    expect(result).not.toBeNull();
    expect(result.getMonth()).toBe(2); // March
  });

  test('Real-world: European EOY 31/12/2025', () => {
    const result = parseDateFlexible('31/12/2025');
    expect(result).not.toBeNull();
    expect(result.getDate()).toBe(31);
    expect(result.getMonth()).toBe(11);
  });

  test('Leap year: Feb 29, 2024', () => {
    const result = parseDateFlexible('02/29/2024');
    expect(result).not.toBeNull();
  });

  test('Non-leap year: reject Feb 29, 2025', () => {
    expect(parseDateFlexible('02/29/2025')).toBeNull();
  });

  test('Past date: 01/01/2020', () => {
    const result = parseDateFlexible('01/01/2020');
    expect(result).not.toBeNull();
    expect(result.getFullYear()).toBe(2020);
  });

  test('Future date: 12/31/2030', () => {
    const result = parseDateFlexible('12/31/2030');
    expect(result).not.toBeNull();
    expect(result.getFullYear()).toBe(2030);
  });

  test('Month abbreviation: Jan 15, 2025', () => {
    const result = parseDateFlexible('Jan 15, 2025');
    expect(result).not.toBeNull();
    expect(result.getMonth()).toBe(0);
  });

  test('Full month name: January 15, 2025', () => {
    const result = parseDateFlexible('January 15, 2025');
    expect(result).not.toBeNull();
  });

  test('Validate year range: reject 1850', () => {
    const result = parseDateFlexible('10/17/1850');
    if (result) {
      expect(result.getFullYear()).toBeGreaterThanOrEqual(1900);
    }
  });
});
