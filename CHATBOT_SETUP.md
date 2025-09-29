# AI Chatbot Setup Guide

## Overview
The CRM now includes an AI-powered chatbot that helps users manage leads through natural language conversations. The chatbot uses Google's Gemini AI to understand user intent and perform CRUD operations on leads.

## Features
- ✅ Create new leads with natural language
- ✅ Search and list leads with filters
- ✅ Update existing lead information
- ✅ View lead details and statistics
- ✅ Conversational interface with context awareness
- ✅ Confirmation prompts for critical actions
- ✅ Quick action buttons
- ✅ Real-time responses

## Setup Instructions

### 1. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 2. Configure Backend
Add the following to your `backend/.env` file:
```bash
GEMINI_API_KEY=your-gemini-api-key-here
```

### 3. Start the Application
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### 4. Access the Chatbot
- Once logged in, look for the blue chat icon in the bottom-right corner
- Click to open the chatbot widget
- Start chatting!

## Usage Examples

### Creating a Lead
```
User: "Create a new lead named John Doe from Acme Corp, email john@acme.com"
Bot: "I'll create a new lead for John Doe from Acme Corp with email john@acme.com. Would you like to add any additional details like phone number or job title?"
User: "Confirm"
Bot: "✅ Lead created successfully! John Doe from Acme Corp (john@acme.com)"
```

### Searching Leads
```
User: "Show me all qualified leads"
Bot: "Found 5 qualified leads: [list of leads]"

User: "What's the email of John Doe?"
Bot: "Let me search for John Doe... Found: john@acme.com"
```

### Updating Leads
```
User: "Update john@acme.com status to contacted"
Bot: "I'll update the status for John Doe to 'contacted'. Confirm this action?"
User: "Yes"
Bot: "✅ Lead updated successfully! John Doe's status is now 'contacted'"
```

### Getting Statistics
```
User: "Show me lead statistics"
Bot: "Here are your lead statistics:
- Total Leads: 150
- Recent Leads (30 days): 45
- By Status: New (30), Contacted (25), Qualified (20)..."
```

## Chatbot Capabilities

### Supported Actions
1. **CREATE_LEAD** - Create new leads
2. **UPDATE_LEAD** - Update existing leads
3. **GET_LEAD** - Get details of specific leads
4. **SEARCH_LEADS** - Search leads by name, email, company
5. **LIST_LEADS** - List leads with filters (status, source)
6. **GET_STATS** - Show lead statistics

### Lead Fields
- **Required for creation**: first_name, last_name, email
- **Optional**: phone, company, job_title, lead_source, status, deal_value, expected_close_date, priority, notes

### Status Values
- new, contacted, qualified, proposal, negotiation, won, lost

### Lead Sources
- website, referral, social_media, cold_call, event, other

### Priority Levels
- low, medium, high

## Architecture

### Backend
- **Service**: `backend/src/services/chatbotService.js` - Main chatbot logic with Gemini AI integration
- **Controller**: `backend/src/controllers/chatbotController.js` - Request handlers
- **Routes**: `backend/src/routes/chatbotRoutes.js` - API endpoints

### Frontend
- **Widget**: `frontend/src/components/Chatbot/ChatbotWidget.jsx` - Main chat interface
- **Message**: `frontend/src/components/Chatbot/ChatMessage.jsx` - Message rendering with lead cards
- **Input**: `frontend/src/components/Chatbot/ChatInput.jsx` - Input field component
- **Service**: `frontend/src/services/chatbotService.js` - API client

### API Endpoints
- `POST /api/chatbot/message` - Send message to chatbot
- `POST /api/chatbot/confirm` - Confirm pending action
- `DELETE /api/chatbot/history` - Clear conversation history

## Customization

### Changing AI Model
To use a different Gemini model, edit `backend/src/services/chatbotService.js`:
```javascript
this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' }); // or gemini-1.5-flash
```

### Adjusting Conversation Context
Modify the system prompt in `chatbotService.js` > `getSystemPrompt()` method to change chatbot behavior.

### Styling
Edit the Tailwind CSS classes in the frontend components to customize appearance.

## Troubleshooting

### Chatbot not responding
1. Check if `GEMINI_API_KEY` is set in `backend/.env`
2. Verify the backend server is running
3. Check browser console for errors
4. Ensure you're logged in with valid authentication

### "Failed to process message" error
- Gemini API key may be invalid or expired
- API quota may be exceeded
- Check backend logs for detailed error messages

### Missing lead data in responses
- Ensure Supabase connection is working
- Check user permissions (RLS policies)
- Verify lead data exists in database

## Security Notes
- API key is stored server-side only
- All requests are authenticated
- RLS policies apply to all database operations
- Conversation history stored in-memory (cleared on server restart)

## Future Enhancements
- [ ] Persistent conversation history (store in Supabase)
- [ ] Voice input support
- [ ] Multi-language support
- [ ] Advanced analytics and insights
- [ ] Integration with other modules (tasks, pipeline, activities)
- [ ] Bulk operations support
- [ ] Export conversation logs

## Support
For issues or questions, refer to the main project documentation or create an issue in the repository.