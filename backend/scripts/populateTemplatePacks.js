/*
 * Populate workflow_template_packs.template_ids
 * - For each active pack, sets template_ids to all public templates
 *   where template.industry == pack.industry OR template.industry == 'general'
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { supabaseAdmin } = require('../src/config/supabase');

async function main() {
  try {
    console.log('[Packs] Fetching active packs...');
    const { data: packs, error: packErr } = await supabaseAdmin
      .from('workflow_template_packs')
      .select('id, name, industry, is_active')
      .eq('is_active', true);

    if (packErr) throw packErr;
    if (!packs || packs.length === 0) {
      console.log('[Packs] No active packs found. Exiting.');
      process.exit(0);
    }

    console.log(`[Packs] Found ${packs.length} active pack(s).`);

    for (const pack of packs) {
      console.log(`\n[Pack] ${pack.name} (${pack.industry}) → populating template_ids...`);

      const { data: templates, error: tmplErr } = await supabaseAdmin
        .from('workflow_templates')
        .select('id, name')
        .eq('is_public', true)
        .or(`industry.eq.${pack.industry},industry.eq.general`);

      if (tmplErr) throw tmplErr;

      const ids = (templates || []).map(t => t.id);
      console.log(`[Pack] Will set ${ids.length} template(s).`);

      const { error: updErr } = await supabaseAdmin
        .from('workflow_template_packs')
        .update({ template_ids: ids })
        .eq('id', pack.id);

      if (updErr) throw updErr;
      console.log(`[Pack] Updated successfully.`);
    }

    console.log('\n[Done] All packs populated.');
    process.exit(0);
  } catch (err) {
    console.error('[Error] Failed to populate packs:', err);
    process.exit(1);
  }
}

main();
