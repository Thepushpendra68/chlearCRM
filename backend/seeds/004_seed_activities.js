/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Check if activities already exist
  const existingActivities = await knex('activities').select('id').limit(1);
  if (existingActivities.length > 0) {
    console.log('Activities already exist, skipping seed');
    return;
  }

  // Get some sample leads and users to reference
  const leads = await knex('leads').select('id').limit(10);
  const users = await knex('users').select('id').limit(3);

  if (leads.length === 0 || users.length === 0) {
    console.log('No leads or users found. Skipping activities seed.');
    return;
  }

  const activities = [];
  const activityTypes = ['call', 'email', 'meeting', 'note', 'task'];
  const outcomes = ['successful', 'no_answer', 'follow_up_required', 'not_interested', 'callback_requested'];
  
  // Create sample activities for testing
  for (let i = 0; i < 30; i++) {
    const lead = leads[Math.floor(Math.random() * leads.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
    const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
    
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
    
    const isCompleted = Math.random() > 0.3; // 70% completed
    
    activities.push({
      lead_id: lead.id,
      user_id: user.id,
      activity_type: activityType,
      subject: getSubjectForType(activityType, i),
      description: getDescriptionForType(activityType, i),
      scheduled_at: activityType === 'meeting' || activityType === 'task' ? 
        new Date(baseDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null, // Random future date for meetings/tasks
      completed_at: isCompleted ? baseDate : null,
      is_completed: isCompleted,
      duration_minutes: (activityType === 'call' || activityType === 'meeting') ? 
        Math.floor(Math.random() * 60) + 15 : null, // 15-75 minutes
      outcome: (activityType === 'call' || activityType === 'email' || activityType === 'meeting') ? outcome : null,
      created_at: baseDate,
      updated_at: baseDate
    });
  }

  // Insert activities
  await knex('activities').insert(activities);
  
  console.log(`Inserted ${activities.length} sample activities`);
};

function getSubjectForType(type, index) {
  const subjects = {
    call: [
      'Initial contact call',
      'Follow-up call',
      'Product demo call',
      'Pricing discussion',
      'Contract negotiation call'
    ],
    email: [
      'Welcome email sent',
      'Product information shared',
      'Proposal sent',
      'Meeting confirmation',
      'Follow-up email'
    ],
    meeting: [
      'Product demonstration',
      'Discovery meeting',
      'Contract review meeting',
      'Onboarding session',
      'Quarterly review'
    ],
    note: [
      'Customer feedback noted',
      'Internal discussion notes',
      'Research findings',
      'Competitor analysis',
      'Strategy meeting notes'
    ],
    task: [
      'Prepare proposal',
      'Send contract',
      'Schedule follow-up',
      'Update CRM records',
      'Research company background'
    ]
  };
  
  const typeSubjects = subjects[type] || ['Generic activity'];
  return typeSubjects[index % typeSubjects.length];
}

function getDescriptionForType(type, index) {
  const descriptions = {
    call: [
      'Called to discuss their requirements and current challenges with their existing solution.',
      'Follow-up call to answer questions raised during initial conversation.',
      'Conducted product demonstration showing key features and benefits.',
      'Discussed pricing options and contract terms.',
      'Negotiated final contract details and next steps.'
    ],
    email: [
      'Sent welcome email with company overview and next steps.',
      'Shared detailed product information and case studies.',
      'Submitted formal proposal with pricing and timeline.',
      'Confirmed meeting details and agenda.',
      'Following up on previous conversation with additional resources.'
    ],
    meeting: [
      'In-person product demonstration with key stakeholders.',
      'Discovery session to understand business requirements.',
      'Contract review meeting with legal and procurement teams.',
      'Onboarding session for new client setup.',
      'Quarterly business review with client success team.'
    ],
    note: [
      'Customer expressed interest in additional features for next quarter.',
      'Team discussed strategy for approaching this enterprise client.',
      'Research shows strong growth potential in their market segment.',
      'Competitive analysis indicates we have strong positioning.',
      'Strategy meeting concluded with clear action items.'
    ],
    task: [
      'Need to prepare customized proposal based on discovery call findings.',
      'Contract needs to be sent for legal review before client presentation.',
      'Schedule follow-up meeting within next two weeks.',
      'Update all CRM records with latest interaction data.',
      'Research company background and recent news before next call.'
    ]
  };
  
  const typeDescriptions = descriptions[type] || ['Generic activity description'];
  return typeDescriptions[index % typeDescriptions.length];
}