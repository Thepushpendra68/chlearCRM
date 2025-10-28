import { describe, it, expect } from 'vitest';
import { normalizePlatformStats } from '../services/platformService';

describe('normalizePlatformStats', () => {
  it('maps snake_case stats to camelCase with period metadata', () => {
    const raw = {
      total_companies: 5,
      active_companies: 3,
      trial_companies: 1,
      total_users: 12,
      active_users: 10,
      active_users_period: 4,
      total_leads: 40,
      leads_created_period: 6,
      total_activities: 18,
      activities_period: 5,
      new_companies_period: 2,
      new_users_period: 7,
      period_key: '7d',
      period_label: 'Last 7 days',
      period_days: 7
    };

    const stats = normalizePlatformStats(raw);

    expect(stats.totalCompanies).toBe(5);
    expect(stats.activeCompanies).toBe(3);
    expect(stats.totalUsers).toBe(12);
    expect(stats.activeUsersPeriod).toBe(4);
    expect(stats.leadsCreatedPeriod).toBe(6);
    expect(stats.newCompaniesPeriod).toBe(2);
    expect(stats.newUsersPeriod).toBe(7);
    expect(stats.activitiesPeriod).toBe(5);
    expect(stats.periodKey).toBe('7d');
    expect(stats.periodLabel).toBe('Last 7 days');
    expect(stats.periodDays).toBe(7);
  });

  it('provides 30d defaults when period metadata is missing', () => {
    const raw = {
      total_companies: 2,
      active_companies: 2,
      trial_companies: 0,
      total_users: 8,
      active_users: 6,
      active_users_30d: 5,
      total_leads: 20,
      leads_created_30d: 9,
      total_activities: 12,
      activities_7d: 3,
      new_companies_30d: 1,
      new_users_30d: 4
    };

    const stats = normalizePlatformStats(raw);

    expect(stats.periodKey).toBe('30d');
    expect(stats.periodLabel).toBe('Last 30 days');
    expect(stats.periodDays).toBe(30);
    expect(stats.activeUsersPeriod).toBe(5);
    expect(stats.leadsCreatedPeriod).toBe(9);
    expect(stats.newCompaniesPeriod).toBe(1);
    expect(stats.newUsersPeriod).toBe(4);
    expect(stats.activitiesPeriod).toBe(3);
  });
});
