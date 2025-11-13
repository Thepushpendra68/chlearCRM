# Voice Interface Implementation Guide
## CHLEAR CRM (Sakha) - Voice Features

---

## 📋 Overview

The Voice Interface feature enables users to interact with CHLEAR CRM using voice commands and speech-to-text functionality. The feature is integrated with the existing AI chatbot system (powered by Google Gemini) to provide natural language voice interactions for CRM operations.

### Key Features

✅ **Speech-to-Text Input** - Convert voice to text for chatbot interactions
✅ **Text-to-Speech Output** - Hear chatbot responses spoken aloud
✅ **Voice Commands** - Navigate and perform actions using voice
✅ **Real-time Visualization** - Audio waveform during voice input
✅ **Customizable Settings** - Language, rate, pitch, volume controls
✅ **Privacy Controls** - User-controlled data retention and analytics

---

## 🏗️ Architecture

### Frontend Components

```
frontend/src/
├── components/Voice/
│   ├── VoiceToggle.jsx          # Microphone toggle button
│   ├── VoiceInput.jsx           # Voice-enabled input component
│   ├── WaveformVisualizer.jsx   # Audio visualization
│   └── VoiceSettings.jsx        # Settings modal
├── context/
│   └── VoiceContext.jsx         # Global voice settings
├── hooks/
│   └── useVoice.js              # Voice functionality hook
└── services/
    └── voiceService.js          # Voice service wrapper
```

### Backend Components

```
backend/src/
├── controllers/
│   └── voiceController.js       # Voice request handlers
├── services/
│   └── voiceService.js          # Business logic
├── routes/
│   └── voiceRoutes.js           # API endpoints
└── app.js                       # Integrated with main app
```

---

## 🚀 Implementation Details

### 1. Voice Service Layer (`voiceService.js`)

**Location:** `frontend/src/services/voiceService.js`

**Purpose:** Wrapper for Web Speech API providing speech-to-text and text-to-speech capabilities.

**Key Methods:**
- `initializeSpeechRecognition()` - Initialize Web Speech API
- `startListening()` - Begin voice recognition
- `stopListening()` - End voice recognition
- `speak(text, options)` - Convert text to speech
- `getVoices()` - Fetch available TTS voices
- `preprocessTranscript()` - Clean voice input
- `formatForSpeech()` - Prepare text for TTS

**Browser Compatibility:**
- ✅ Chrome/Edge (Full support)
- ⚠️ Firefox (Limited - TTS only)
- ⚠️ Safari (Partial - webkit prefix)

### 2. Voice Hook (`useVoice`)

**Location:** `frontend/src/hooks/useVoice.js`

**Purpose:** React hook providing voice functionality to components.

**Returns:**
```javascript
{
  isListening,     // Boolean - Currently listening
  isSpeaking,      // Boolean - Currently speaking
  transcript,      // String - Final transcript
  interimTranscript, // String - Interim results
  isSupported,     // Boolean - Browser support
  error,           // String - Error message
  startListening,  // Function
  stopListening,   // Function
  toggleListening, // Function
  speak,           // Function
  stopSpeaking,    // Function
  clearTranscript  // Function
}
```

### 3. Voice Context (`VoiceContext`)

**Location:** `frontend/src/context/VoiceContext.jsx`

**Purpose:** Global state management for voice settings.

**Settings:**
```javascript
{
  enabled: true,              // Voice feature enabled
  language: 'en-US',          // Recognition language
  autoSpeak: true,            // Auto-speak responses
  voiceActivation: false,     // Wake word detection
  wakeWord: 'Hey Sakha',      // Wake phrase
  rate: 1.0,                  // Speech rate (0.5-2.0)
  pitch: 1.0,                 // Speech pitch (0.5-2.0)
  volume: 1.0,                // Volume (0-1)
  silenceDelay: 5000,         // Auto-stop delay (ms)
  privacy: {
    storeVoiceNotes: true,
    allowVoiceAnalytics: true,
    dataRetentionDays: 30
  }
}
```

### 4. Voice Components

#### VoiceToggle
- **Props:** `isListening`, `isSpeaking`, `onToggle`, `disabled`, `size`, `variant`
- **States:** Default, Listening (red pulse), Speaking (green), Error

#### VoiceInput
- Combines text input with voice capabilities
- Shows waveform visualization during recording
- Displays interim transcript in real-time
- Keyboard shortcut: `Ctrl+Shift+V`

#### WaveformVisualizer
- Real-time audio visualization
- Animated bars during voice input
- Customizable colors and height

#### VoiceSettings
- Language selection
- Speech rate/pitch/volume sliders
- Privacy settings
- Wake word configuration

---

## 🔌 Integration Points

### 1. ChatbotWidget Integration

**Location:** `frontend/src/components/Chatbot/ChatbotWidget.jsx`

**Changes:**
- Added voice mode toggle (Text/Voice)
- Integrated `VoiceToggle` button
- Added `VoiceInput` component
- Voice transcripts auto-sent to chatbot
- Optional auto-speak for responses

**Flow:**
```
Voice Input → Transcript → ChatbotService → AI Processing → Response → TTS
```

### 2. Backend API Integration

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/voice/transcript` | Process voice through chatbot |
| GET | `/api/voice/settings` | Get user voice settings |
| PUT | `/api/voice/settings` | Update voice settings |
| POST | `/api/voice/tts` | Format text for speech |
| POST | `/api/voice/command` | Process voice commands |
| GET | `/api/voice/analytics` | Get usage statistics |

**Rate Limiting:** 30 requests/minute

### 3. Database Schema (To Be Implemented)

**Tables to Create:**

```sql
-- User voice settings
CREATE TABLE user_voice_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'en-US',
  auto_speak BOOLEAN DEFAULT true,
  voice_activation BOOLEAN DEFAULT false,
  wake_word VARCHAR(50) DEFAULT 'Hey Sakha',
  rate DECIMAL(3,1) DEFAULT 1.0,
  pitch DECIMAL(3,1) DEFAULT 1.0,
  volume DECIMAL(3,1) DEFAULT 1.0,
  silence_delay INTEGER DEFAULT 5000,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Voice analytics
CREATE TABLE voice_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  accuracy_score DECIMAL(5,2),
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Voice notes
CREATE TABLE voice_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  transcription TEXT,
  audio_url VARCHAR(500),
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 💡 Usage Guide

### For Users

#### Starting Voice Input

1. **Open Chatbot:** Click the chatbot icon (bottom-right)
2. **Enable Voice Mode:** Click "Voice" tab in the input area
3. **Start Listening:** Click the microphone button or press `Ctrl+Shift+V`
4. **Speak:** Your words appear as you speak
5. **Auto-send:** Transcript automatically sent to chatbot when complete

#### Voice Commands

**Navigation:**
- "Go to leads" → Navigate to leads page
- "Open pipeline" → Navigate to pipeline
- "Show my tasks" → Navigate to tasks
- "Show dashboard" → Navigate to dashboard

**Quick Actions:**
- "Create a new lead" → Open create lead modal
- "Add task" → Open create task modal
- "Search for [query]" → Perform global search

**Complex Queries:** Send to chatbot for natural language processing

#### Voice Settings

Access via chatbot → Settings icon → Voice Settings

**Available Options:**
- Language (EN, HI, ES, FR, DE, ZH)
- Speech rate, pitch, volume
- Auto-speak responses (on/off)
- Privacy controls
- Data retention period

### For Developers

#### Adding Voice to a New Component

```javascript
import useVoice from '../hooks/useVoice';
import { useVoiceContext } from '../context/VoiceContext';

function MyComponent() {
  const { settings: voiceSettings } = useVoiceContext();
  const {
    isListening,
    isSpeaking,
    transcript,
    startListening,
    stopListening,
    speak
  } = useVoice({
    language: voiceSettings.language,
    rate: voiceSettings.rate,
    pitch: voiceSettings.pitch,
    volume: voiceSettings.volume
  });

  const handleTranscript = async (voiceTranscript) => {
    // Process voice input
    console.log('Voice transcript:', voiceTranscript);
  };

  return (
    <div>
      <VoiceInput onVoiceTranscript={handleTranscript} />
    </div>
  );
}
```

#### Processing Voice Through Chatbot

```javascript
import api from '../services/api';

const processVoiceMessage = async (transcript) => {
  try {
    const response = await api.post('/voice/transcript', {
      transcript
    });

    const { response: chatbotResponse, action, requiresConfirmation } = response.data;

    // Handle response
    console.log('Chatbot response:', chatbotResponse);
  } catch (error) {
    console.error('Voice processing error:', error);
  }
};
```

---

## 🔧 Configuration

### Environment Variables

**Frontend** (`frontend/.env`):
```
VITE_VOICE_ENABLED=true
VITE_VOICE_DEFAULT_LANGUAGE=en-US
VITE_VOICE_WAKE_WORD=Hey Sakha
```

**Backend** (`backend/.env`):
```
VOICE_RATE_LIMIT=30
VOICE_SILENCE_TIMEOUT=5000
VOICE_MAX_TRANSCRIPT_LENGTH=500
```

### Feature Flags

Enable/disable voice features via context:

```javascript
// Check if voice is enabled
const { isEnabled } = useVoiceContext();

if (isEnabled()) {
  // Show voice features
}
```

---

## 📊 Analytics & Monitoring

### Tracked Metrics

1. **Usage Statistics**
   - Voice commands per session
   - Voice-to-text vs typing ratio
   - Most used voice commands
   - Average session duration

2. **Performance Metrics**
   - Speech recognition accuracy
   - TTS response time
   - API request latency
   - Error rates

3. **User Engagement**
   - Feature adoption rate
   - Retention (Day 1, 7, 30)
   - Settings changes
   - Feature usage frequency

### Analytics Endpoints

```javascript
// Log voice event
await api.post('/voice/analytics', {
  event: 'voice_command_used',
  data: {
    command: 'create_lead',
    accuracy: 0.95,
    duration: 3000
  }
});

// Get analytics
const analytics = await api.get('/voice/analytics?period=7d');
```

---

## 🛡️ Security & Privacy

### Data Handling

1. **No Persistent Storage (Default)**
   - Voice transcripts processed in memory only
   - Not stored unless explicitly enabled

2. **Optional Voice Notes**
   - User-controlled storage
   - Stored in Supabase Storage
   - Configurable retention period

3. **Analytics (Opt-in)**
   - Anonymous usage statistics
   - No raw voice data stored
   - User can disable anytime

### Privacy Controls

Users can configure:
- ✅ Enable/disable voice features
- ✅ Auto-speak on/off
- ✅ Voice note storage (on/off)
- ✅ Analytics participation (on/off)
- ✅ Data retention period (7-365 days)
- ✅ Delete all voice data

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Voice Not Working

**Symptoms:** Microphone button doesn't respond

**Solutions:**
- Check browser support (Chrome/Edge recommended)
- Ensure microphone permissions granted
- Check if voice settings enabled
- Verify HTTPS (required for some browsers)

#### 2. Poor Recognition Accuracy

**Symptoms:** Transcripts frequently incorrect

**Solutions:**
- Adjust microphone position
- Speak slower and clearer
- Check language setting matches speech
- Minimize background noise
- Use noise-canceling microphone

#### 3. TTS Not Working

**Symptoms:** Responses not spoken

**Solutions:**
- Check browser TTS support
- Verify `autoSpeak` setting enabled
- Check volume settings
- Test with different text

#### 4. High CPU/Battery Usage

**Symptoms:** System runs hot, battery drains quickly

**Solutions:**
- Reduce silence timeout (stops listening faster)
- Disable continuous listening
- Close unused browser tabs
- Use voice activation mode instead of continuous

### Debug Tools

#### Browser DevTools

Check console for errors:
```javascript
// Check if voice is supported
console.log('Speech recognition:', !!window.SpeechRecognition);
console.log('Speech synthesis:', 'speechSynthesis' in window);

// Check active voice settings
console.log('Voice settings:', voiceSettings);
```

#### Network Tab

Monitor API calls:
- `POST /api/voice/transcript`
- `GET /api/voice/settings`
- `PUT /api/voice/settings`

---

## 🚦 Testing

### Unit Tests

**Voice Service Tests:**
```javascript
describe('voiceService', () => {
  test('should start listening', async () => {
    await voiceService.startListening();
    expect(voiceService.isListening).toBe(true);
  });

  test('should preprocess transcript', () => {
    const processed = voiceService.preprocessTranscript('um, create a lead please');
    expect(processed).toBe('Create a lead please');
  });
});
```

**Hook Tests:**
```javascript
describe('useVoice', () => {
  test('should return voice state', () => {
    const { result } = renderHook(() => useVoice());
    expect(result.current.isSupported).toBeDefined();
  });
});
```

### Integration Tests

**Chatbot Voice Flow:**
1. Mock voice transcript
2. Verify transcript sent to API
3. Verify chatbot response received
4. Verify TTS called if enabled

**E2E Tests:**
- Voice input to lead creation
- Voice navigation commands
- Voice settings persistence
- Cross-browser compatibility

---

## 📈 Future Enhancements

### Phase 2: Voice Commands Expansion

**Additional Commands:**
- Voice filtering: "Show high-priority leads"
- Voice sorting: "Sort by deal value"
- Voice bulk actions: "Delete all qualified leads"

**Implementation:**
```javascript
const VOICE_COMMANDS = {
  FILTER: /show (.*?) leads/,
  SORT: /sort by (.*?)/,
  BULK: /delete all (.*?) leads/
};
```

### Phase 3: Advanced Voice Features

1. **Wake Word Detection**
   - Continuous listening for "Hey Sakha"
   - Custom wake phrases
   - Low-power mode

2. **Voice Biometrics**
   - Speaker identification
   - Voice-based authentication
   - Multi-user voice profiles

3. **Offline Mode**
   - Local speech recognition
   - Cached responses
   - Sync when online

4. **Voice Analytics Dashboard**
   - Usage insights
   - Accuracy metrics
   - Improvement suggestions

### Phase 4: AI-Powered Voice

1. **Contextual Understanding**
   - Remember previous commands
   - Follow-up questions
   - Conversational context

2. **Voice Shortcuts**
   - Create custom voice macros
   - Voice templates for common actions
   - Personalized command library

3. **Multi-Language Support**
   - Automatic language detection
   - Code-switching within conversations
   - Regional accent adaptation

---

## 📚 API Reference

### Frontend API

#### `useVoice(options)`
Custom hook for voice functionality.

**Parameters:**
```javascript
{
  language: 'en-US',  // Recognition language
  rate: 1.0,          // Speech rate
  pitch: 1.0,         // Speech pitch
  volume: 1.0         // Volume level
}
```

**Returns:** Voice state and functions (see above)

#### `useVoiceContext()`
Global voice settings context.

**Returns:**
```javascript
{
  settings,          // Current settings
  loading,           // Loading state
  updateSettings,    // Update function
  toggleAutoSpeak,   // Toggle function
  // ... other methods
}
```

### Backend API

#### `POST /api/voice/transcript`
Process voice transcript through chatbot.

**Request:**
```javascript
{
  transcript: "Create a new lead for John Doe"
}
```

**Response:**
```javascript
{
  success: true,
  data: {
    transcript,
    response: "I'll help you create a lead for John Doe.",
    action: "CREATE_LEAD",
    requiresConfirmation: true,
    actionData: { ... }
  }
}
```

#### `GET /api/voice/settings`
Retrieve user voice settings.

**Response:**
```javascript
{
  success: true,
  data: {
    enabled: true,
    language: 'en-US',
    // ... other settings
  }
}
```

#### `PUT /api/voice/settings`
Update voice settings.

**Request:**
```javascript
{
  language: 'hi-IN',
  autoSpeak: false,
  rate: 1.2
}
```

**Response:**
```javascript
{
  success: true,
  data: { /* updated settings */ },
  message: "Voice settings updated successfully"
}
```

---

## 🎯 Best Practices

### For Users

1. **Clear Speech**: Speak clearly and at moderate pace
2. **Quiet Environment**: Minimize background noise
3. **Consistent Volume**: Maintain steady speaking volume
4. **Use Keywords**: Include action words (create, update, search)
5. **Review Settings**: Adjust language and speed to your preference

### For Developers

1. **Error Handling**: Always handle voice errors gracefully
2. **Fallbacks**: Provide text input alternative
3. **Performance**: Use silence timeout to prevent resource waste
4. **Accessibility**: Ensure voice features are additive, not required
5. **Privacy**: Respect user data choices
6. **Testing**: Test across different browsers and devices

### For Administrators

1. **Monitor Usage**: Track adoption and performance metrics
2. **User Training**: Provide onboarding for voice features
3. **Support Documentation**: Maintain troubleshooting guides
4. **Feedback Collection**: Gather user feedback for improvements
5. **Security Review**: Regular audit of voice data handling

---

## 🔗 Related Documentation

- [Chatbot Implementation](./CHATBOT_DOCUMENTATION_INDEX.md)
- [Supabase Integration](../SUPABASE_SETUP.md)
- [API Documentation](../API_REFERENCE.md)
- [Component Library](../COMPONENT_LIBRARY.md)

---

## 📞 Support

For issues or questions:

1. Check this documentation
2. Review troubleshooting section
3. Check browser console for errors
4. Contact support team with:
   - Browser version
   - Voice settings
   - Error messages
   - Steps to reproduce

---

**Last Updated:** November 13, 2025
**Version:** 1.0.0
**Authors:** Claude Code Implementation
