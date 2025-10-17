/**
 * Test script to debug fuzzy matching in isolation
 * This test doesn't require database connection - it tests the validation engine directly
 * Run: node test-fuzzy-debug.js
 */

const ImportValidationEngine = require('./src/services/importValidationEngine');

function testFuzzyMatching() {
  console.log('='.repeat(80));
  console.log('FUZZY MATCHING DEBUG TEST');
  console.log('='.repeat(80));

  try {
    // Test Case 1: WITH fuzzyMatchData (labels)
    console.log('\n' + '='.repeat(80));
    console.log('TEST CASE 1: WITH Picklist Labels (fuzzyMatchData present)');
    console.log('='.repeat(80));

    const configWithLabels = {
      enums: {
        status: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'converted', 'nurture'],
        lead_source: ['website', 'referral', 'outbound_call', 'cold_call', 'social_paid', 'social_media', 'event', 'partner', 'email', 'advertisement', 'other', 'import'],
        priority: ['low', 'medium', 'high', 'urgent']
      },
      requiredFields: ['first_name', 'last_name'],
      fuzzyMatchData: {
        lead_source: [
          { value: 'website', label: 'Website' },
          { value: 'website', label: 'Web Form' },
          { value: 'social_media', label: 'Instagram' },
          { value: 'social_media', label: 'Facebook' },
          { value: 'event', label: 'Walk-In' },
          { value: 'event', label: 'Trade Show' },
          { value: 'cold_call', label: 'Phone' },
          { value: 'referral', label: 'Referral' }
        ],
        status: [
          { value: 'new', label: 'New Lead' },
          { value: 'contacted', label: 'Contacted' },
          { value: 'lost', label: 'Closed Lost' },
          { value: 'proposal', label: 'Proposal' }
        ],
        priority: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'urgent', label: 'Urgent' }
        ]
      }
    };

    const engineWithLabels = new ImportValidationEngine(configWithLabels);

    const testCasesWithLabels = [
      { field: 'lead_source', value: 'Instagram', expected: 'social_media' },
      { field: 'lead_source', value: 'Walk-In', expected: 'event' },
      { field: 'status', value: 'New Lead', expected: 'new' },
      { field: 'status', value: 'Closed Lost', expected: 'lost' },
      { field: 'lead_source', value: 'website', expected: 'website' },
    ];

    console.log('\nTesting with picklist labels:');
    testCasesWithLabels.forEach(test => {
      const result = engineWithLabels.normalizeEnumValue(test.value, test.field);
      const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} "${test.value}" (${test.field}) → ${result} (expected: ${test.expected})`);
    });

    // Test Case 2: WITHOUT fuzzyMatchData (fallback labels)
    console.log('\n' + '='.repeat(80));
    console.log('TEST CASE 2: WITHOUT Picklist Labels (fallback to enum values as labels)');
    console.log('='.repeat(80));

    const configWithoutLabels = {
      enums: {
        status: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'converted', 'nurture'],
        lead_source: ['website', 'referral', 'outbound_call', 'cold_call', 'social_paid', 'social_media', 'event', 'partner', 'email', 'advertisement', 'other', 'import'],
        priority: ['low', 'medium', 'high', 'urgent']
      },
      requiredFields: ['first_name', 'last_name'],
      fuzzyMatchData: {
        lead_source: [
          { value: 'website', label: 'website' },
          { value: 'referral', label: 'referral' },
          { value: 'outbound_call', label: 'outbound_call' },
          { value: 'cold_call', label: 'cold_call' },
          { value: 'social_paid', label: 'social_paid' },
          { value: 'social_media', label: 'social_media' },
          { value: 'event', label: 'event' },
          { value: 'partner', label: 'partner' },
          { value: 'email', label: 'email' },
          { value: 'advertisement', label: 'advertisement' },
          { value: 'other', label: 'other' },
          { value: 'import', label: 'import' }
        ],
        status: [
          { value: 'new', label: 'new' },
          { value: 'contacted', label: 'contacted' },
          { value: 'qualified', label: 'qualified' },
          { value: 'proposal', label: 'proposal' },
          { value: 'negotiation', label: 'negotiation' },
          { value: 'won', label: 'won' },
          { value: 'lost', label: 'lost' },
          { value: 'converted', label: 'converted' },
          { value: 'nurture', label: 'nurture' }
        ],
        priority: [
          { value: 'low', label: 'low' },
          { value: 'medium', label: 'medium' },
          { value: 'high', label: 'high' },
          { value: 'urgent', label: 'urgent' }
        ]
      }
    };

    const engineWithoutLabels = new ImportValidationEngine(configWithoutLabels);

    const testCasesWithoutLabels = [
      { field: 'lead_source', value: 'website', expected: 'website' },
      { field: 'lead_source', value: 'referral', expected: 'referral' },
      { field: 'status', value: 'new', expected: 'new' },
      { field: 'status', value: 'lost', expected: 'lost' },
    ];

    console.log('\nTesting without custom picklist labels (using enum values as labels):');
    testCasesWithoutLabels.forEach(test => {
      const result = engineWithoutLabels.normalizeEnumValue(test.value, test.field);
      const status = result === test.expected ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} "${test.value}" (${test.field}) → ${result} (expected: ${test.expected})`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ ALL TESTS COMPLETE');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ ERROR during test:', error.message);
    console.error(error.stack);
  }
}

testFuzzyMatching();
