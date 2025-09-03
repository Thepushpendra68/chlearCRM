# Phase 2: Lead Management & Tracking - Implementation Plan

## Project Overview
Building advanced lead management features including pipeline management, activity tracking, lead assignment, reporting, and import/export functionality on top of the existing CRM foundation.

## Phase 2 Goals
Transform the basic CRM into a comprehensive lead tracking system with:
- Visual pipeline management with drag-and-drop
- Comprehensive activity logging and timeline
- Advanced lead assignment and routing
- Detailed reporting and analytics
- Bulk import/export capabilities
- Lead scoring system
- Follow-up reminders and task management

## New Database Schema Extensions

### 1. Lead Pipeline Stages
```sql
-- New table: pipeline_stages
CREATE TABLE pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    color VARCHAR(7) DEFAULT '#3B82F6', -- Hex color code
    order_position INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    is_won BOOLEAN DEFAULT false,
    is_lost BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modify leads table to reference pipeline stages
ALTER TABLE leads 
ADD COLUMN pipeline_stage_id UUID REFERENCES pipeline_stages(id),
ADD COLUMN expected_close_date DATE,
ADD COLUMN deal_value DECIMAL(10,2) DEFAULT 0,
ADD COLUMN probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
ADD COLUMN lost_reason VARCHAR(100);

-- Create index for pipeline queries
CREATE INDEX idx_leads_pipeline_stage ON leads(pipeline_stage_id);
```

### 2. Activities & Timeline
```sql
-- New table: activities
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    activity_type VARCHAR(20) NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'task', 'sms', 'stage_change', 'assignment_change')),
    subject VARCHAR(200),
    description TEXT,
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    duration_minutes INTEGER,
    outcome VARCHAR(50), -- 'successful', 'no_answer', 'follow_up_required', etc.
    metadata JSONB, -- Store additional activity-specific data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for activity queries
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_scheduled_at ON activities(scheduled_at);
CREATE INDEX idx_activities_type ON activities(activity_type);
```

### 3. Lead Assignment & Routing
```sql
-- New table: lead_assignment_rules
CREATE TABLE lead_assignment_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    conditions JSONB NOT NULL, -- Store rule conditions
    assignment_type VARCHAR(20) NOT NULL CHECK (assignment_type IN ('round_robin', 'specific_user', 'team')),
    assigned_to UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table: lead_assignment_history
CREATE TABLE lead_assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    previous_assigned_to UUID REFERENCES users(id),
    new_assigned_to UUID REFERENCES users(id),
    assigned_by UUID NOT NULL REFERENCES users(id),
    assignment_reason VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Tasks & Reminders
```sql
-- New table: tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to UUID NOT NULL REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date TIMESTAMP,
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    task_type VARCHAR(20) DEFAULT 'follow_up' CHECK (task_type IN ('follow_up', 'call', 'email', 'meeting', 'demo', 'proposal', 'other')),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for task queries
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
```

### 5. Lead Scoring
```sql
-- New table: lead_scoring_rules
CREATE TABLE lead_scoring_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    criteria JSONB NOT NULL, -- Store scoring criteria
    points INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add lead scoring to leads table
ALTER TABLE leads 
ADD COLUMN score INTEGER DEFAULT 0,
ADD COLUMN last_scored_at TIMESTAMP;

-- Create index for lead scoring
CREATE INDEX idx_leads_score ON leads(score);
```

## Implementation Phases

### Phase 2.1: Pipeline Management (Week 5)

#### Backend Implementation
**Files to Create**:
- `backend/src/controllers/pipelineController.js`
- `backend/src/services/pipelineService.js`
- `backend/src/routes/pipelineRoutes.js`
- `backend/migrations/005_create_pipeline_stages.js`
- `backend/migrations/006_modify_leads_for_pipeline.js`

**API Endpoints**:
```javascript
// Pipeline stage management
GET /api/pipeline/stages - Get all pipeline stages
POST /api/pipeline/stages - Create new stage
PUT /api/pipeline/stages/:id - Update stage
DELETE /api/pipeline/stages/:id - Delete stage
PUT /api/pipeline/stages/reorder - Reorder stages

// Pipeline operations
GET /api/pipeline/overview - Get pipeline overview with counts
PUT /api/leads/:id/move-stage - Move lead to different stage
GET /api/pipeline/conversion-rates - Get stage conversion analytics
```

**Key Features**:
- Default pipeline stages (New → Qualified → Contacted → Proposal → Won/Lost)
- Custom stage creation and management
- Stage reordering with drag-and-drop support
- Win/loss tracking
- Pipeline analytics and conversion rates

#### Frontend Implementation
**Files to Create**:
- `frontend/src/pages/Pipeline.jsx` - Visual pipeline kanban view
- `frontend/src/components/Pipeline/PipelineBoard.jsx` - Kanban board component
- `frontend/src/components/Pipeline/PipelineColumn.jsx` - Individual pipeline stage column
- `frontend/src/components/Pipeline/LeadCard.jsx` - Draggable lead cards
- `frontend/src/components/Pipeline/StageManager.jsx` - Stage configuration modal
- `frontend/src/services/pipelineService.js` - Pipeline API calls
- `frontend/src/hooks/useDragAndDrop.js` - Drag and drop functionality

**UI Features**:
- Kanban-style pipeline board
- Drag-and-drop lead movement between stages
- Stage customization (colors, names, order)
- Pipeline metrics display
- Quick lead creation from pipeline view
- Stage-specific actions and filters

### Phase 2.2: Activity Tracking System (Week 6)

#### Backend Implementation
**Files to Create**:
- `backend/src/controllers/activityController.js`
- `backend/src/services/activityService.js`
- `backend/src/routes/activityRoutes.js`
- `backend/migrations/007_create_activities_table.js`
- `backend/src/services/timelineService.js`

**API Endpoints**:
```javascript
// Activity management
GET /api/activities - Get activities with filters (lead_id, user_id, type, date_range)
POST /api/activities - Create new activity
PUT /api/activities/:id - Update activity
DELETE /api/activities/:id - Delete activity
PUT /api/activities/:id/complete - Mark activity as completed

// Timeline and history
GET /api/leads/:id/timeline - Get complete lead timeline
GET /api/leads/:id/activities - Get lead-specific activities
GET /api/users/:id/activities - Get user's activities
POST /api/activities/bulk - Create multiple activities
```

**Activity Types**:
- **Calls**: Phone calls with outcome tracking
- **Emails**: Email communications
- **Meetings**: Scheduled meetings and demos
- **Notes**: General notes and observations
- **Tasks**: Action items and follow-ups
- **SMS**: Text message communications
- **System Events**: Stage changes, assignments, etc.

#### Frontend Implementation
**Files to Create**:
- `frontend/src/components/Timeline/Timeline.jsx` - Lead timeline component
- `frontend/src/components/Timeline/ActivityItem.jsx` - Individual activity item
- `frontend/src/components/Activities/ActivityForm.jsx` - Activity creation form
- `frontend/src/components/Activities/ActivityList.jsx` - Activity list view
- `frontend/src/components/Activities/QuickActions.jsx` - Quick activity buttons
- `frontend/src/pages/Activities.jsx` - Activities management page
- `frontend/src/services/activityService.js` - Activity API calls

**UI Features**:
- Interactive timeline on lead detail page
- Quick activity logging (call, email, note)
- Activity filtering and search
- Bulk activity operations
- Activity templates for common actions
- Real-time activity updates

### Phase 2.3: Lead Assignment & Routing (Week 7)

#### Backend Implementation
**Files to Create**:
- `backend/src/controllers/assignmentController.js`
- `backend/src/services/assignmentService.js`
- `backend/src/services/routingService.js`
- `backend/src/routes/assignmentRoutes.js`
- `backend/migrations/008_create_assignment_tables.js`
- `backend/src/utils/assignmentRules.js`

**API Endpoints**:
```javascript
// Assignment management
GET /api/assignments/rules - Get assignment rules
POST /api/assignments/rules - Create assignment rule
PUT /api/assignments/rules/:id - Update assignment rule
DELETE /api/assignments/rules/:id - Delete assignment rule

// Lead assignment operations
POST /api/leads/assign - Assign leads manually
POST /api/leads/bulk-assign - Bulk assign leads
GET /api/leads/:id/assignment-history - Get assignment history
POST /api/leads/auto-assign - Trigger auto-assignment

// Team management
GET /api/assignments/workload - Get team workload distribution
POST /api/assignments/redistribute - Redistribute leads
```

**Assignment Features**:
- **Round Robin**: Distribute leads evenly among team members
- **Rule-Based**: Assign based on lead criteria (source, location, industry)
- **Manual Assignment**: Direct assignment by managers
- **Workload Balancing**: Prevent overload of individual team members
- **Assignment History**: Track all assignment changes

#### Frontend Implementation
**Files to Create**:
- `frontend/src/pages/Assignments.jsx` - Assignment management page
- `frontend/src/components/Assignment/RuleBuilder.jsx` - Visual rule builder
- `frontend/src/components/Assignment/WorkloadDashboard.jsx` - Team workload view
- `frontend/src/components/Assignment/BulkAssignment.jsx` - Bulk assignment modal
- `frontend/src/components/Assignment/AssignmentHistory.jsx` - Assignment timeline
- `frontend/src/services/assignmentService.js` - Assignment API calls

### Phase 2.4: Reporting & Analytics (Week 8)

#### Backend Implementation
**Files to Create**:
- `backend/src/controllers/reportController.js`
- `backend/src/services/reportService.js`
- `backend/src/routes/reportRoutes.js`
- `backend/src/utils/reportGenerator.js`
- `backend/src/services/analyticsService.js` (extend existing)

**API Endpoints**:
```javascript
// Standard reports
GET /api/reports/lead-performance - Lead performance metrics
GET /api/reports/conversion-funnel - Conversion funnel analysis
GET /api/reports/activity-summary - Activity summary reports
GET /api/reports/team-performance - Team performance metrics
GET /api/reports/pipeline-health - Pipeline health analysis

// Custom reports
POST /api/reports/custom - Generate custom report
GET /api/reports/export/:type - Export reports (PDF, Excel, CSV)
GET /api/reports/scheduled - Get scheduled reports
POST /api/reports/schedule - Schedule recurring reports
```

**Report Types**:
- **Lead Performance**: Conversion rates, response times, win/loss analysis
- **Team Performance**: Individual and team metrics, activity levels
- **Pipeline Analysis**: Stage progression, bottlenecks, forecasting
- **Activity Reports**: Communication frequency, outcome tracking
- **Custom Reports**: User-defined metrics and dimensions

#### Frontend Implementation
**Files to Create**:
- `frontend/src/pages/Reports.jsx` - Main reports page
- `frontend/src/components/Reports/ReportBuilder.jsx` - Custom report builder
- `frontend/src/components/Reports/Chart.jsx` - Reusable chart component
- `frontend/src/components/Reports/ReportExport.jsx` - Export functionality
- `frontend/src/components/Reports/ScheduledReports.jsx` - Report scheduling
- `frontend/src/services/reportService.js` - Report API calls

### Phase 2.5: Import/Export & Tasks (Week 8)

#### Backend Implementation
**Files to Create**:
- `backend/src/controllers/importController.js`
- `backend/src/controllers/taskController.js`
- `backend/src/services/importService.js`
- `backend/src/services/taskService.js`
- `backend/src/routes/importRoutes.js`
- `backend/src/routes/taskRoutes.js`
- `backend/migrations/009_create_tasks_table.js`
- `backend/src/utils/csvParser.js`
- `backend/src/utils/excelParser.js`

**API Endpoints**:
```javascript
// Import/Export operations
POST /api/import/leads - Import leads from CSV/Excel
GET /api/import/template - Download import template
GET /api/import/history - Get import history
POST /api/export/leads - Export leads to various formats
GET /api/export/status/:id - Check export status

// Task management
GET /api/tasks - Get tasks with filters
POST /api/tasks - Create new task
PUT /api/tasks/:id - Update task
DELETE /api/tasks/:id - Delete task
PUT /api/tasks/:id/complete - Mark task as completed
GET /api/tasks/overdue - Get overdue tasks
```

#### Frontend Implementation
**Files to Create**:
- `frontend/src/pages/Tasks.jsx` - Task management page
- `frontend/src/components/Import/ImportWizard.jsx` - Step-by-step import process
- `frontend/src/components/Import/FieldMapping.jsx` - CSV field mapping
- `frontend/src/components/Export/ExportModal.jsx` - Export options modal
- `frontend/src/components/Tasks/TaskList.jsx` - Task list component
- `frontend/src/components/Tasks/TaskForm.jsx` - Task creation/edit form
- `frontend/src/services/importService.js` - Import/export API calls
- `frontend/src/services/taskService.js` - Task API calls

## Advanced Features Implementation

### Lead Scoring System
**Files to Create**:
- `backend/src/services/scoringService.js`
- `backend/src/controllers/scoringController.js`
- `backend/migrations/010_create_scoring_tables.js`
- `frontend/src/components/Scoring/ScoreRuleBuilder.jsx`

**Scoring Criteria**:
- Demographic information (company size, industry, location)
- Behavioral data (email opens, website visits, content downloads)
- Engagement level (response time, meeting acceptance)
- Pipeline progression (time in stages, stage advancement)

### Real-time Notifications
**Files to Create**:
- `backend/src/services/notificationService.js`
- `backend/src/controllers/notificationController.js`
- `frontend/src/components/Notifications/NotificationCenter.jsx`
- `frontend/src/hooks/useRealTimeNotifications.js`

**Notification Types**:
- New lead assignments
- Task due date reminders
- Stage progression alerts
- Team performance milestones

### Mobile Responsiveness Enhancements
- Optimize pipeline view for mobile devices
- Touch-friendly drag and drop
- Mobile-specific activity logging
- Responsive charts and reports

## Technical Architecture Enhancements

### Database Optimizations
```sql
-- Add composite indexes for common query patterns
CREATE INDEX idx_activities_lead_user_date ON activities(lead_id, user_id, created_at DESC);
CREATE INDEX idx_tasks_assigned_due ON tasks(assigned_to, due_date) WHERE status != 'completed';
CREATE INDEX idx_leads_pipeline_assigned ON leads(pipeline_stage_id, assigned_to);

-- Add triggers for automatic scoring updates
CREATE OR REPLACE FUNCTION update_lead_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Trigger lead scoring recalculation when relevant data changes
    UPDATE leads SET last_scored_at = CURRENT_TIMESTAMP WHERE id = NEW.lead_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lead_score
    AFTER INSERT OR UPDATE ON activities
    FOR EACH ROW
    EXECUTE FUNCTION update_lead_score();
```

### Performance Considerations
- Implement Redis caching for pipeline data
- Use database views for complex reporting queries
- Add pagination to all list endpoints
- Implement background job processing for imports
- Use websockets for real-time pipeline updates

### Security Enhancements
- Add field-level permissions for sensitive lead data
- Implement audit logging for all lead modifications
- Add data encryption for sensitive notes and activities
- Rate limiting on import/export operations

## Testing Strategy

### Backend Testing
```javascript
// Example test for pipeline operations
describe('Pipeline Service', () => {
  test('should move lead to next stage', async () => {
    const leadId = 'test-lead-id';
    const newStageId = 'qualified-stage-id';
    
    const result = await pipelineService.moveLeadToStage(leadId, newStageId, userId);
    
    expect(result.success).toBe(true);
    expect(result.lead.pipeline_stage_id).toBe(newStageId);
    
    // Verify activity was logged
    const activities = await Activity.findByLeadId(leadId);
    expect(activities[0].activity_type).toBe('stage_change');
  });
});
```

### Frontend Testing
```javascript
// Example test for pipeline board
test('Pipeline board renders correctly', () => {
  render(<PipelineBoard leads={mockLeads} stages={mockStages} />);
  
  expect(screen.getByText('New')).toBeInTheDocument();
  expect(screen.getByText('Qualified')).toBeInTheDocument();
  expect(screen.getAllByTestId('lead-card')).toHaveLength(5);
});
```

## Development Timeline

### Week 5: Pipeline Management
- Days 1-2: Backend pipeline API and database migrations
- Days 3-4: Frontend pipeline board with drag-and-drop
- Day 5: Testing and bug fixes

### Week 6: Activity Tracking
- Days 1-2: Backend activity system and timeline API
- Days 3-4: Frontend timeline component and activity forms
- Day 5: Integration testing and performance optimization

### Week 7: Assignment & Routing
- Days 1-2: Backend assignment rules and routing logic
- Days 3-4: Frontend assignment management interface
- Day 5: Testing assignment workflows

### Week 8: Reporting & Import/Export
- Days 1-2: Backend reporting APIs and import/export functionality
- Days 3-4: Frontend report builder and import wizard
- Day 5: End-to-end testing and deployment preparation

## Success Metrics for Phase 2

### Functional Requirements
- [ ] Users can manage pipeline stages and move leads through stages
- [ ] Complete activity timeline for each lead with all interaction types
- [ ] Automatic and manual lead assignment working correctly
- [ ] Comprehensive reporting with export capabilities
- [ ] Bulk import/export of leads with field mapping
- [ ] Task management with due date reminders
- [ ] Lead scoring system providing meaningful insights

### Performance Requirements
- [ ] Pipeline board loads in <2 seconds with 1000+ leads
- [ ] Timeline loads instantly for leads with 100+ activities
- [ ] Import processes 1000+ leads in <30 seconds
- [ ] Reports generate in <5 seconds for standard queries
- [ ] Real-time updates work smoothly without lag

### User Experience Requirements
- [ ] Intuitive drag-and-drop pipeline interface
- [ ] Mobile-responsive design on all new features
- [ ] Consistent design language with existing components
- [ ] Clear feedback for all user actions
- [ ] Helpful error messages and validation

## Risk Mitigation

### Data Integrity Risks
- Use database transactions for complex operations
- Implement comprehensive validation rules
- Add audit trails for all data modifications
- Regular database backups before major changes

### Performance Risks
- Load test with realistic data volumes
- Monitor database query performance
- Implement proper indexing strategy
- Use caching for frequently accessed data

### User Adoption Risks
- Provide comprehensive onboarding tutorials
- Implement progressive feature rollout
- Gather user feedback early and iterate
- Ensure backward compatibility with existing workflows

This Phase 2 implementation will transform your basic CRM into a comprehensive lead management system that rivals commercial solutions like LeadSquare's core functionality.