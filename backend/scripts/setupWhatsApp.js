/**
 * WhatsApp Meta Integration Setup Script
 * 
 * This script configures WhatsApp Meta Business API credentials
 * Run this after setting up your Meta WhatsApp Business account
 * 
 * Usage: node scripts/setupWhatsApp.js
 */

require('dotenv').config();
const { supabaseAdmin } = require('../src/config/supabase');

// Your Meta WhatsApp credentials
const WHATSAPP_CONFIG = {
  access_token: process.env.META_WHATSAPP_ACCESS_TOKEN || 'EAAKJE4CSuHEBPZCSmyQMobBe6p9W8zhZBHR9SISHrijOEngI0qWdtU1EBZBx8ZBl37k12fg1xPys8ZB3ibxionSRZC7eZCprqHxc4f4UOBy7VGIplaYMiYyHqXhY1n3nq6dp3LfINwECo9WovUV2T712esorLBV3yB5ZBCeN3YngneKpFvYRZBR1khCzA2nsX4f1yZCFAQhkCQz8VuttPSsdAcKZA3gCqBIPSZB3gky76AWxPgZDZD',
  phone_number_id: process.env.META_WHATSAPP_PHONE_NUMBER_ID || '754391564431502',
  business_account_id: process.env.META_WHATSAPP_BUSINESS_ACCOUNT_ID || '1779313026310884',
  app_secret: process.env.META_WHATSAPP_APP_SECRET || 'ca13696e2b7b91f712be7ac495a5bcd1',
  app_id: process.env.META_WHATSAPP_APP_ID || '713666807904369',
  client_token: process.env.META_WHATSAPP_CLIENT_TOKEN || '5826c0ee457d62a7f68fb54828dabc24'
};

async function setupWhatsAppIntegration() {
  try {
    console.log('🚀 Starting WhatsApp Meta Integration Setup...\n');

    // Get all companies (you may want to filter by specific company)
    const { data: companies, error: companiesError } = await supabaseAdmin
      .from('companies')
      .select('id, name')
      .eq('status', 'active');

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`);
    }

    if (!companies || companies.length === 0) {
      console.log('❌ No active companies found. Please create a company first.');
      return;
    }

    console.log(`📋 Found ${companies.length} active company/companies:\n`);
    companies.forEach((company, index) => {
      console.log(`${index + 1}. ${company.name} (ID: ${company.id})`);
    });

    // For now, set up for all companies
    // You can modify this to target a specific company
    for (const company of companies) {
      console.log(`\n🔧 Configuring WhatsApp for: ${company.name}...`);

      // Check if integration already exists
      const { data: existing, error: checkError } = await supabaseAdmin
        .from('integration_settings')
        .select('id')
        .eq('company_id', company.id)
        .eq('type', 'whatsapp')
        .eq('provider', 'meta')
        .maybeSingle();

      const config = {
        access_token: WHATSAPP_CONFIG.access_token,
        phone_number_id: WHATSAPP_CONFIG.phone_number_id,
        business_account_id: WHATSAPP_CONFIG.business_account_id,
        app_secret: WHATSAPP_CONFIG.app_secret,
        app_id: WHATSAPP_CONFIG.app_id,
        client_token: WHATSAPP_CONFIG.client_token
      };

      if (existing) {
        // Update existing
        const { data, error } = await supabaseAdmin
          .from('integration_settings')
          .update({
            config,
            is_active: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) {
          console.error(`❌ Error updating integration for ${company.name}:`, error.message);
          continue;
        }

        console.log(`✅ Updated WhatsApp integration for ${company.name}`);
      } else {
        // Create new
        const { data, error } = await supabaseAdmin
          .from('integration_settings')
          .insert({
            company_id: company.id,
            type: 'whatsapp',
            provider: 'meta',
            config,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) {
          console.error(`❌ Error creating integration for ${company.name}:`, error.message);
          continue;
        }

        console.log(`✅ Created WhatsApp integration for ${company.name}`);
      }
    }

    console.log('\n✅ WhatsApp integration setup complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Configure webhook in Meta App Dashboard:');
    console.log('   - Webhook URL: https://your-domain.com/api/whatsapp/webhooks/meta');
    console.log('   - Verify Token: (set in META_WHATSAPP_VERIFY_TOKEN env var)');
    console.log('   - Subscribe to: messages, message_status');
    console.log('2. Test sending a message via API');
    console.log('3. Send a WhatsApp message to your number to test incoming messages\n');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupWhatsAppIntegration()
  .then(() => {
    console.log('✨ Setup script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });

