/**
 * Email System API Test Script
 * Run this in your browser console after logging into the CRM
 */

class EmailSystemTester {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: []
    };
    this.baseUrl = window.location.origin;
    this.token = localStorage.getItem('token') || localStorage.getItem('supabase.auth.token');
  }

  async getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  log(message, type = 'info') {
    const prefix = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }[type];
    console.log(`${prefix} ${message}`);
  }

  async test(name, testFn) {
    try {
      this.log(`Testing: ${name}`, 'info');
      await testFn();
      this.results.passed.push(name);
      this.log(`PASSED: ${name}`, 'success');
    } catch (error) {
      this.results.failed.push({ name, error: error.message });
      this.log(`FAILED: ${name} - ${error.message}`, 'error');
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Email System Tests...\n');

    // Test 1: Check email routes are registered
    await this.test('Email routes registered', async () => {
      const response = await fetch(`${this.baseUrl}/api/email/templates`, {
        headers: await this.getHeaders()
      });
      if (!response.ok && response.status !== 401) {
        throw new Error(`Routes not registered: ${response.status}`);
      }
    });

    // Test 2: Get templates (should work even if empty)
    await this.test('Get email templates', async () => {
      const response = await fetch(`${this.baseUrl}/api/email/templates`, {
        headers: await this.getHeaders()
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      this.log(`   Found ${data.data?.length || 0} templates`, 'info');
    });

    // Test 3: Create test template
    let testTemplateId = null;
    await this.test('Create email template', async () => {
      const response = await fetch(`${this.baseUrl}/api/email/templates`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({
          name: `Test Template ${Date.now()}`,
          subject: 'Test Subject {{lead.name}}',
          category: 'general',
          folder: 'Test',
          description: 'Automated test template',
          is_active: true
        })
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      testTemplateId = data.data.id;
      this.log(`   Created template ID: ${testTemplateId}`, 'info');
    });

    // Test 4: Get template by ID
    if (testTemplateId) {
      await this.test('Get template by ID', async () => {
        const response = await fetch(`${this.baseUrl}/api/email/templates/${testTemplateId}`, {
          headers: await this.getHeaders()
        });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
        const data = await response.json();
        if (data.data.name.indexOf('Test Template') === -1) {
          throw new Error('Template data mismatch');
        }
      });
    }

    // Test 5: Compile MJML
    await this.test('Compile MJML to HTML', async () => {
      const mjml = `<mjml><mj-body><mj-section><mj-column><mj-text>Hello {{lead.name}}</mj-text></mj-column></mj-section></mj-body></mjml>`;
      const response = await fetch(`${this.baseUrl}/api/email/templates/compile-mjml`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({ mjml })
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      if (!data.html || data.html.length < 50) {
        throw new Error('MJML compilation failed');
      }
      this.log(`   Compiled to ${data.html.length} characters`, 'info');
    });

    // Test 6: Get folders
    await this.test('Get template folders', async () => {
      const response = await fetch(`${this.baseUrl}/api/email/templates/folders`, {
        headers: await this.getHeaders()
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      this.log(`   Found ${data.data?.length || 0} folders`, 'info');
    });

    // Test 7: Get sequences
    await this.test('Get email sequences', async () => {
      const response = await fetch(`${this.baseUrl}/api/email/sequences`, {
        headers: await this.getHeaders()
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      this.log(`   Found ${data.data?.length || 0} sequences`, 'info');
    });

    // Test 8: Create sequence
    let testSequenceId = null;
    await this.test('Create email sequence', async () => {
      const response = await fetch(`${this.baseUrl}/api/email/sequences`, {
        method: 'POST',
        headers: await this.getHeaders(),
        body: JSON.stringify({
          name: `Test Sequence ${Date.now()}`,
          description: 'Automated test sequence',
          trigger_event: 'lead_created',
          is_active: false,
          steps: [
            {
              step_order: 1,
              action_type: 'send_email',
              template_id: testTemplateId || 'test-id'
            },
            {
              step_order: 2,
              action_type: 'wait',
              wait_days: 1,
              wait_hours: 0
            }
          ]
        })
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      testSequenceId = data.data.id;
      this.log(`   Created sequence ID: ${testSequenceId}`, 'info');
    });

    // Test 9: Get sent emails
    await this.test('Get sent emails', async () => {
      const response = await fetch(`${this.baseUrl}/api/email/sent?limit=10`, {
        headers: await this.getHeaders()
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      this.log(`   Found ${data.data?.length || 0} sent emails`, 'info');
    });

    // Test 10: Get suppression list
    await this.test('Get suppression list', async () => {
      const response = await fetch(`${this.baseUrl}/api/email/suppression`, {
        headers: await this.getHeaders()
      });
      if (!response.ok) throw new Error(`Status: ${response.status}`);
      const data = await response.json();
      this.log(`   Found ${data.data?.length || 0} suppressed emails`, 'info');
    });

    // Test 11: Clean up test data
    if (testTemplateId) {
      await this.test('Delete test template', async () => {
        const response = await fetch(`${this.baseUrl}/api/email/templates/${testTemplateId}`, {
          method: 'DELETE',
          headers: await this.getHeaders()
        });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
      });
    }

    if (testSequenceId) {
      await this.test('Delete test sequence', async () => {
        const response = await fetch(`${this.baseUrl}/api/email/sequences/${testSequenceId}`, {
          method: 'DELETE',
          headers: await this.getHeaders()
        });
        if (!response.ok) throw new Error(`Status: ${response.status}`);
      });
    }

    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Passed: ${this.results.passed.length}`);
    console.log(`❌ Failed: ${this.results.failed.length}`);
    console.log(`⚠️  Warnings: ${this.results.warnings.length}`);
    
    if (this.results.failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.failed.forEach(({ name, error }) => {
        console.log(`   - ${name}: ${error}`);
      });
    }

    if (this.results.passed.length === this.results.passed.length + this.results.failed.length) {
      console.log('\n🎉 ALL TESTS PASSED! Email system is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.');
    }
    console.log('='.repeat(50) + '\n');
  }
}

// Auto-run tests
console.log('Email System API Tester loaded!\n');
console.log('To run tests, execute: tester.runAllTests()\n');
const tester = new EmailSystemTester();

// Uncomment to auto-run:
// tester.runAllTests();

