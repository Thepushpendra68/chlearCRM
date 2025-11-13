# Chatbot Expansion Summary

Total Controllers: 12
Total Methods: 108
Average Methods per Controller: 9.0

## Controllers
- activity: 15 methods
- assignment: 18 methods
- auth: 6 methods
- automation: 9 methods
- emailSend: 7 methods
- emailTemplate: 12 methods
- emailWebhook: 4 methods
- import: 8 methods
- leadCapture: 1 methods
- pipeline: 9 methods
- task: 9 methods
- workflowTemplate: 10 methods

## All Actions (108 total)
- **_GET_ACTIVITIES** (activity.getActivities)
- **_GET_ACTIVITY_BY_ID** (activity.getActivityById)
- **_CREATE_ACTIVITY** (activity.createActivity)
- **_UPDATE_ACTIVITY** (activity.updateActivity)
- **_DELETE_ACTIVITY** (activity.deleteActivity)
- **_COMPLETE_ACTIVITY** (activity.completeActivity)
- **_GET_LEAD_TIMELINE** (activity.getLeadTimeline)
- **_GET_LEAD_ACTIVITIES** (activity.getLeadActivities)
- **_GET_USER_ACTIVITIES** (activity.getUserActivities)
- **_CREATE_BULK_ACTIVITIES** (activity.createBulkActivities)
- **_GET_ACTIVITY_STATS** (activity.getActivityStats)
- **_GET_LEAD_TIMELINE_SUMMARY** (activity.getLeadTimelineSummary)
- **_GET_USER_TIMELINE** (activity.getUserTimeline)
- **_GET_TEAM_TIMELINE** (activity.getTeamTimeline)
- **_GET_ACTIVITY_TRENDS** (activity.getActivityTrends)

- **_GET_RULES** (assignment.getRules)
- **_GET_ACTIVE_RULES** (assignment.getActiveRules)
- **_GET_RULE_BY_ID** (assignment.getRuleById)
- **_CREATE_RULE** (assignment.createRule)
- **_UPDATE_RULE** (assignment.updateRule)
- **_DELETE_RULE** (assignment.deleteRule)
- **_ASSIGN_LEAD** (assignment.assignLead)
- **_BULK_ASSIGN_LEADS** (assignment.bulkAssignLeads)
- **_GET_LEAD_ASSIGNMENT_HISTORY** (assignment.getLeadAssignmentHistory)
- **_GET_TEAM_WORKLOAD** (assignment.getTeamWorkload)
- **_GET_ASSIGNMENT_HISTORY** (assignment.getAssignmentHistory)
- **_REDISTRIBUTE_LEADS** (assignment.redistributeLeads)
- **_GET_ASSIGNMENT_STATS** (assignment.getAssignmentStats)
- **_AUTO_ASSIGN_LEAD** (assignment.autoAssignLead)
- **_PROCESS_BULK_AUTO_ASSIGNMENT** (assignment.processBulkAutoAssignment)
- **_GET_ASSIGNMENT_RECOMMENDATIONS** (assignment.getAssignmentRecommendations)
- **_GET_ROUTING_STATS** (assignment.getRoutingStats)
- **_REASSIGN_LEAD** (assignment.reassignLead)

- **_REGISTER** (auth.register)
- **_LOGIN** (auth.login)
- **_GET_PROFILE** (auth.getProfile)
- **_UPDATE_PROFILE** (auth.updateProfile)
- **_CHANGE_PASSWORD** (auth.changePassword)
- **_LOGOUT** (auth.logout)

- **_GET_SEQUENCES** (automation.getSequences)
- **_GET_SEQUENCE_BY_ID** (automation.getSequenceById)
- **_CREATE_SEQUENCE** (automation.createSequence)
- **_UPDATE_SEQUENCE** (automation.updateSequence)
- **_DELETE_SEQUENCE** (automation.deleteSequence)
- **_ENROLL_LEAD** (automation.enrollLead)
- **_UNENROLL_LEAD** (automation.unenrollLead)
- **_GET_ENROLLMENTS** (automation.getEnrollments)
- **_PROCESS_DUE_ENROLLMENTS** (automation.processDueEnrollments)

- **_SEND_TO_LEAD** (emailSend.sendToLead)
- **_SEND_TO_EMAIL** (emailSend.sendToEmail)
- **_GET_SENT_EMAILS** (emailSend.getSentEmails)
- **_GET_EMAIL_DETAILS** (emailSend.getEmailDetails)
- **_GET_SUPPRESSION_LIST** (emailSend.getSuppressionList)
- **_ADD_TO_SUPPRESSION_LIST** (emailSend.addToSuppressionList)
- **_REMOVE_FROM_SUPPRESSION_LIST** (emailSend.removeFromSuppressionList)

- **_GET_TEMPLATES** (emailTemplate.getTemplates)
- **_GET_TEMPLATE_BY_ID** (emailTemplate.getTemplateById)
- **_CREATE_TEMPLATE** (emailTemplate.createTemplate)
- **_UPDATE_TEMPLATE** (emailTemplate.updateTemplate)
- **_DELETE_TEMPLATE** (emailTemplate.deleteTemplate)
- **_CREATE_VERSION** (emailTemplate.createVersion)
- **_PUBLISH_VERSION** (emailTemplate.publishVersion)
- **_COMPILE_M_J_M_L** (emailTemplate.compileMJML)
- **_PREVIEW_TEMPLATE** (emailTemplate.previewTemplate)
- **_GET_FOLDERS** (emailTemplate.getFolders)
- **_GET_INTEGRATION_SETTINGS** (emailTemplate.getIntegrationSettings)
- **_UPSERT_INTEGRATION_SETTINGS** (emailTemplate.upsertIntegrationSettings)

- **_HANDLE_POSTMARK_WEBHOOK** (emailWebhook.handlePostmarkWebhook)
- **_HANDLE_SEND_GRID_WEBHOOK** (emailWebhook.handleSendGridWebhook)
- **_FOR** (emailWebhook.for)
- **_TEST_WEBHOOK** (emailWebhook.testWebhook)

- **_IMPORT_LEADS** (import.importLeads)
- **_DRY_RUN_LEADS** (import.dryRunLeads)
- **_GET_IMPORT_HISTORY** (import.getImportHistory)
- **_VALIDATE_IMPORT_FILE** (import.validateImportFile)
- **_CONVERT_TO_C_S_V** (import.convertToCSV)
- **_CONVERT_TO_EXCEL** (import.convertToExcel)
- **_GET_SUGGESTED_MAPPINGS** (import.getSuggestedMappings)
- **_GET_UPLOAD_MIDDLEWARE** (import.getUploadMiddleware)

- **_FOR** (leadCapture.for)

- **_GET_STAGES** (pipeline.getStages)
- **_CREATE_STAGE** (pipeline.createStage)
- **_UPDATE_STAGE** (pipeline.updateStage)
- **_DELETE_STAGE** (pipeline.deleteStage)
- **_REORDER_STAGES** (pipeline.reorderStages)
- **_GET_PIPELINE_OVERVIEW** (pipeline.getPipelineOverview)
- **_MOVE_LEAD_TO_STAGE** (pipeline.moveLeadToStage)
- **_GET_CONVERSION_RATES** (pipeline.getConversionRates)
- **_CREATE_DEFAULT_STAGES** (pipeline.createDefaultStages)

- **_GET_TASKS** (task.getTasks)
- **_GET_TASK_BY_ID** (task.getTaskById)
- **_CREATE_TASK** (task.createTask)
- **_UPDATE_TASK** (task.updateTask)
- **_COMPLETE_TASK** (task.completeTask)
- **_DELETE_TASK** (task.deleteTask)
- **_GET_OVERDUE_TASKS** (task.getOverdueTasks)
- **_GET_TASK_STATS** (task.getTaskStats)
- **_GET_TASKS_BY_LEAD_ID** (task.getTasksByLeadId)

- **_GET_TEMPLATES** (workflowTemplate.getTemplates)
- **_GET_TEMPLATE_BY_ID** (workflowTemplate.getTemplateById)
- **_CREATE_TEMPLATE** (workflowTemplate.createTemplate)
- **_CREATE_SEQUENCE_FROM_TEMPLATE** (workflowTemplate.createSequenceFromTemplate)
- **_UPDATE_TEMPLATE** (workflowTemplate.updateTemplate)
- **_DELETE_TEMPLATE** (workflowTemplate.deleteTemplate)
- **_EXPORT_TEMPLATE** (workflowTemplate.exportTemplate)
- **_IMPORT_TEMPLATE** (workflowTemplate.importTemplate)
- **_GET_TEMPLATE_PACKS** (workflowTemplate.getTemplatePacks)
- **_GET_PACK_BY_ID** (workflowTemplate.getPackById)

## Next Steps
1. Review this list
2. Prioritize actions by module
3. Add to chatbotService.js and chatbotFallback.js
4. Update system prompt
5. Test thoroughly

Generated: 2025-11-13T08:24:29.639Z
