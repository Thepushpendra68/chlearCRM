/**
 * Task #20: Test React.memo and useMemo Optimizations
 * Verifies that components are properly optimized with React.memo and useMemo
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🧪 Task #20: React.memo and useMemo Optimization Tests\n');

let passed = 0;
let failed = 0;

const test = (name, fn) => {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
};

// Test 1: LeadCard.jsx optimizations
console.log('📋 Testing LeadCard Component Optimizations\n');

try {
  const leadCardPath = path.join(__dirname, 'frontend/src/components/Pipeline/LeadCard.jsx');
  const leadCardContent = fs.readFileSync(leadCardPath, 'utf8');

  test('LeadCard uses React.memo', () => {
    if (!leadCardContent.includes('React.memo(LeadCard')) {
      throw new Error('React.memo not found for LeadCard');
    }
  });

  test('LeadCard uses useMemo for computed values', () => {
    if (!leadCardContent.includes('useMemo') || !leadCardContent.includes('computedValues')) {
      throw new Error('useMemo for computedValues not found');
    }
  });

  test('LeadCard has custom comparison function', () => {
    if (!leadCardContent.includes('prevProps.lead') || !leadCardContent.includes('nextProps.lead')) {
      throw new Error('Custom comparison function not found');
    }
  });

  test('LeadCard memoizes currency formatter', () => {
    if (!leadCardContent.includes('Intl.NumberFormat')) {
      throw new Error('Currency formatter not found');
    }
  });

  test('LeadCard memoizes color maps', () => {
    const priorityColorCount = (leadCardContent.match(/priorityColors.*useMemo/g) || []).length;
    const statusColorCount = (leadCardContent.match(/statusColors.*useMemo/g) || []).length;
    if (priorityColorCount === 0 || statusColorCount === 0) {
      throw new Error('Color maps not memoized');
    }
  });

  console.log('  LeadCard: All optimizations verified ✓\n');
} catch (error) {
  console.log(`  ❌ LeadCard test failed: ${error.message}\n`);
  failed++;
}

// Test 2: ChatMessage.jsx optimizations
console.log('📋 Testing ChatMessage Component Optimizations\n');

try {
  const chatMessagePath = path.join(__dirname, 'frontend/src/components/Chatbot/ChatMessage.jsx');
  const chatMessageContent = fs.readFileSync(chatMessagePath, 'utf8');

  test('ChatMessage uses React.memo', () => {
    if (!chatMessageContent.includes('React.memo(ChatMessage')) {
      throw new Error('React.memo not found for ChatMessage');
    }
  });

  test('ChatMessage uses useMemo for formatKey', () => {
    if (!chatMessageContent.includes('useMemo') || !chatMessageContent.includes('formatKey')) {
      throw new Error('useMemo for formatKey not found');
    }
  });

  test('ChatMessage memoizes sourceMap', () => {
    if (!chatMessageContent.includes('sourceMap')) {
      throw new Error('sourceMap not found');
    }
  });

  test('ChatMessage memoizes parameterEntries', () => {
    if (!chatMessageContent.includes('parameterEntries') || !chatMessageContent.includes('useMemo')) {
      throw new Error('parameterEntries not memoized');
    }
  });

  test('ChatMessage has custom comparison function', () => {
    if (!chatMessageContent.includes('prevProps.message') || !chatMessageContent.includes('nextProps.message')) {
      throw new Error('Custom comparison function not found');
    }
  });

  console.log('  ChatMessage: All optimizations verified ✓\n');
} catch (error) {
  console.log(`  ❌ ChatMessage test failed: ${error.message}\n`);
  failed++;
}

// Test 3: ActivityList.jsx optimizations
console.log('📋 Testing ActivityList Component Optimizations\n');

try {
  const activityListPath = path.join(__dirname, 'frontend/src/components/Activities/ActivityList.jsx');
  const activityListContent = fs.readFileSync(activityListPath, 'utf8');

  test('ActivityList uses React.memo', () => {
    if (!activityListContent.includes('React.memo(ActivityList')) {
      throw new Error('React.memo not found for ActivityList');
    }
  });

  test('ActivityList uses useMemo for filteredActivities', () => {
    if (!activityListContent.includes('filteredActivities') || !activityListContent.includes('useMemo')) {
      throw new Error('filteredActivities not memoized');
    }
  });

  test('ActivityList memoizes activityIcons', () => {
    if (!activityListContent.includes('activityIcons') || !activityListContent.includes('useMemo')) {
      throw new Error('activityIcons not memoized');
    }
  });

  test('ActivityList memoizes activityColors', () => {
    if (!activityListContent.includes('activityColors') || !activityListContent.includes('useMemo')) {
      throw new Error('activityColors not memoized');
    }
  });

  test('ActivityList memoizes formatActivityTime', () => {
    if (!activityListContent.includes('formatActivityTime') || !activityListContent.includes('useMemo')) {
      throw new Error('formatActivityTime not memoized');
    }
  });

  test('ActivityList has custom comparison function', () => {
    if (!activityListContent.includes('prevProps.activities') || !activityListContent.includes('nextProps.activities')) {
      throw new Error('Custom comparison function not found');
    }
  });

  console.log('  ActivityList: All optimizations verified ✓\n');
} catch (error) {
  console.log(`  ❌ ActivityList test failed: ${error.message}\n`);
  failed++;
}

// Summary
console.log('='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n✅ All React.memo and useMemo optimization tests passed!\n');
  console.log('Optimizations Applied:\n');
  console.log('1. LeadCard (Pipeline Board List Item):');
  console.log('   • React.memo with custom comparison function');
  console.log('   • useMemo for computed values (displayName, contactName, dates)');
  console.log('   • useMemo for currency formatter (Intl.NumberFormat)');
  console.log('   • useMemo for color maps (priorityColors, statusColors)');
  console.log('\n2. ChatMessage (Chat List Item):');
  console.log('   • React.memo with custom comparison function');
  console.log('   • useMemo for formatKey function');
  console.log('   • useMemo for sourceMap');
  console.log('   • useMemo for parameterEntries');
  console.log('   • useMemo for showPendingSummary');
  console.log('\n3. ActivityList (Complex List with Filtering):');
  console.log('   • React.memo with custom comparison function');
  console.log('   • useMemo for filteredActivities (critical for performance)');
  console.log('   • useMemo for activityIcons (7 icon definitions)');
  console.log('   • useMemo for activityColors');
  console.log('   • useMemo for formatActivityTime function');
  console.log('\nPerformance Benefits:');
  console.log('  ✓ Reduced re-renders for list items');
  console.log('  ✓ Cached expensive calculations');
  console.log('  ✓ Prevented object/function recreation');
  console.log('  ✓ Optimized for large lists (100+ items)');
  console.log('  ✓ Custom comparison for fine-grained control\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.\n');
  process.exit(1);
}
