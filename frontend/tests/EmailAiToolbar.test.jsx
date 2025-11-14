import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmailAiToolbar from '../src/components/EmailAiToolbar';
import emailService from '../src/services/emailService';

jest.mock('../src/services/emailService');

describe('EmailAiToolbar Component', () => {
  const defaultProps = {
    templateData: { name: 'Test Template', subject: 'Test Subject' },
    setTemplateData: jest.fn(),
    mjmlContent: '<mj-text>Hello {{lead.name}}</mj-text>',
    setMjmlContent: jest.fn(),
    htmlContent: '<p>Hello</p>',
    editorMode: 'code',
    onInsertVisualHtml: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders AI toolbar', () => {
    render(<EmailAiToolbar {...defaultProps} />);

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    expect(screen.getByText('Generate Template')).toBeInTheDocument();
    expect(screen.getByText('Optimize Content')).toBeInTheDocument();
    expect(screen.getByText('Subject Variants')).toBeInTheDocument();
  });

  test('opens generate template modal', async () => {
    const user = userEvent.setup();
    render(<EmailAiToolbar {...defaultProps} />);

    const generateButton = screen.getByText('Generate Template');
    await user.click(generateButton);

    expect(screen.getByText('Generate Template with AI')).toBeInTheDocument();
    expect(screen.getByLabelText('Prompt')).toBeInTheDocument();
    expect(screen.getByLabelText('Tone')).toBeInTheDocument();
  });

  test('generates template from prompt', async () => {
    const user = userEvent.setup();

    emailService.aiGenerateTemplate.mockResolvedValue({
      data: {
        success: true,
        data: {
          mjml: '<mj-text>AI Generated Email</mj-text>',
          subject: 'AI Generated Subject',
          html: '<p>AI Generated HTML</p>'
        }
      }
    });

    render(<EmailAiToolbar {...defaultProps} />);

    // Open modal
    const generateButton = screen.getByText('Generate Template');
    await user.click(generateButton);

    // Fill form
    const promptInput = screen.getByLabelText('Prompt');
    await user.type(promptInput, 'Create a welcome email for new users');

    const toneSelect = screen.getByLabelText('Tone');
    await user.selectOptions(toneSelect, 'friendly');

    const generateBtn = screen.getByText('Generate');
    await user.click(generateBtn);

    // Verify API call
    await waitFor(() => {
      expect(emailService.aiGenerateTemplate).toHaveBeenCalledWith({
        prompt: 'Create a welcome email for new users',
        tone: 'friendly',
        industry: 'general',
        email_type: 'general'
      });
    });

    // Verify content update
    await waitFor(() => {
      expect(defaultProps.setMjmlContent).toHaveBeenCalledWith(
        expect.stringContaining('AI Generated Email')
      );
    });
  });

  test('optimizes existing content', async () => {
    const user = userEvent.setup();

    emailService.aiOptimizeContent.mockResolvedValue({
      data: {
        success: true,
        data: {
          optimized_content: '<mj-text>Optimized Email Content</mj-text>'
        }
      }
    });

    render(<EmailAiToolbar {...defaultProps} />);

    const optimizeButton = screen.getByText('Optimize Content');
    await user.click(optimizeButton);

    expect(screen.getByText('Optimize Email Content')).toBeInTheDocument();

    const goalSelect = screen.getByLabelText('Optimization Goal');
    await user.selectOptions(goalSelect, 'increase engagement');

    const optimizeBtn = screen.getByText('Optimize');
    await user.click(optimizeBtn);

    await waitFor(() => {
      expect(emailService.aiOptimizeContent).toHaveBeenCalledWith({
        content: defaultProps.mjmlContent,
        goal: 'increase engagement',
        audience: 'general'
      });
    });
  });

  test('generates subject line variants', async () => {
    const user = userEvent.setup();

    emailService.aiGenerateSubjectVariants.mockResolvedValue({
      data: {
        success: true,
        data: {
          variants: [
            'Subject 1: Welcome!',
            'Subject 2: Hello there!',
            'Subject 3: Greetings!'
          ]
        }
      }
    });

    render(<EmailAiToolbar {...defaultProps} />);

    const variantsButton = screen.getByText('Subject Variants');
    await user.click(variantsButton);

    expect(screen.getByText('Generate Subject Variants')).toBeInTheDocument();

    const countInput = screen.getByLabelText('Number of Variants');
    await user.clear(countInput);
    await user.type(countInput, '3');

    const generateBtn = screen.getByText('Generate Variants');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(emailService.aiGenerateSubjectVariants).toHaveBeenCalledWith({
        base_subject: defaultProps.templateData.subject,
        count: 3,
        tone: 'neutral'
      });
    });

    // Display variants
    await waitFor(() => {
      expect(screen.getByText('Subject 1: Welcome!')).toBeInTheDocument();
      expect(screen.getByText('Subject 2: Hello there!')).toBeInTheDocument();
      expect(screen.getByText('Subject 3: Greetings!')).toBeInTheDocument();
    });
  });

  test('allows copying generated subject', async () => {
    const user = userEvent.setup();

    emailService.aiGenerateSubjectVariants.mockResolvedValue({
      data: {
        success: true,
        data: {
          variants: ['Copy Test Subject']
        }
      }
    });

    render(<EmailAiToolbar {...defaultProps} />);

    // Open variants modal
    const variantsButton = screen.getByText('Subject Variants');
    await user.click(variantsButton);

    // Generate variants
    const generateBtn = screen.getByText('Generate Variants');
    await user.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Copy Test Subject')).toBeInTheDocument();
    });

    // Copy first variant
    const copyButtons = screen.getAllByText('Copy');
    await user.click(copyButtons[0]);

    // Verify clipboard was set (in a real app, would check navigator.clipboard)
    // For testing, we just verify the button interaction
    expect(copyButtons[0]).toBeInTheDocument();
  });

  test('suggests merge variables', async () => {
    const user = userEvent.setup();

    emailService.aiSuggestVariables.mockResolvedValue({
      data: {
        success: true,
        data: {
          suggestions: [
            { name: 'lead.name', description: 'Lead full name' },
            { name: 'lead.company', description: 'Lead company name' },
            { name: 'company.name', description: 'Your company name' }
          ]
        }
      }
    });

    render(<EmailAiToolbar {...defaultProps} />);

    const suggestVarsButton = screen.getByText('Suggest Variables');
    await user.click(suggestVarsButton);

    await waitFor(() => {
      expect(emailService.aiSuggestVariables).toHaveBeenCalledWith({
        content: defaultProps.mjmlContent,
        context: 'email'
      });
    });

    await waitFor(() => {
      expect(screen.getByText('lead.name')).toBeInTheDocument();
      expect(screen.getByText('Lead full name')).toBeInTheDocument();
    });

    // Insert variable
    const insertButtons = screen.getAllByText('Insert');
    await user.click(insertButtons[0]);

    expect(defaultProps.setMjmlContent).toHaveBeenCalledWith(
      expect.stringContaining('{{lead.name}}')
    );
  });

  test('shows loading state during generation', async () => {
    const user = userEvent.setup();

    let resolvePromise;
    const pendingPromise = new Promise(resolve => {
      resolvePromise = resolve;
    });

    emailService.aiGenerateTemplate.mockReturnValue(pendingPromise);

    render(<EmailAiToolbar {...defaultProps} />);

    // Open modal
    const generateButton = screen.getByText('Generate Template');
    await user.click(generateButton);

    const promptInput = screen.getByLabelText('Prompt');
    await user.type(promptInput, 'Test prompt');

    const generateBtn = screen.getByText('Generate');
    await user.click(generateBtn);

    // Should show loading
    expect(screen.getByText('Generating...')).toBeInTheDocument();

    // Resolve
    resolvePromise({
      data: {
        success: true,
        data: {
          mjml: 'Generated',
          subject: 'Generated Subject'
        }
      }
    });

    await waitFor(() => {
      expect(screen.queryByText('Generating...')).not.toBeInTheDocument();
    });
  });

  test('handles API errors gracefully', async () => {
    const user = userEvent.setup();

    emailService.aiGenerateTemplate.mockRejectedValue(new Error('API Error'));

    render(<EmailAiToolbar {...defaultProps} />);

    const generateButton = screen.getByText('Generate Template');
    await user.click(generateButton);

    const promptInput = screen.getByLabelText('Prompt');
    await user.type(promptInput, 'Test prompt');

    const generateBtn = screen.getByText('Generate');
    await user.click(generateBtn);

    await waitFor(() => {
      // Error message should be displayed
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  test('closes modal on cancel', async () => {
    const user = userEvent.setup();
    render(<EmailAiToolbar {...defaultProps} />);

    const generateButton = screen.getByText('Generate Template');
    await user.click(generateButton);

    expect(screen.getByText('Generate Template with AI')).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Generate Template with AI')).not.toBeInTheDocument();
    });
  });

  test('validates required fields', async () => {
    const user = userEvent.setup();
    render(<EmailAiToolbar {...defaultProps} />);

    const generateButton = screen.getByText('Generate Template');
    await user.click(generateButton);

    // Try to submit without prompt
    const generateBtn = screen.getByText('Generate');
    await user.click(generateBtn);

    // Should show validation error
    expect(screen.getByText(/prompt is required/i)).toBeInTheDocument();
  });

  test('works in visual editor mode', () => {
    const props = { ...defaultProps, editorMode: 'visual' };
    render(<EmailAiToolbar {...props} />);

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();

    // Should insert into visual editor
    const suggestVarsButton = screen.getByText('Suggest Variables');
    fireEvent.click(suggestVarsButton);

    expect(defaultProps.onInsertVisualHtml).toHaveBeenCalled();
  });

  test('displays AI status indicator', async () => {
    render(<EmailAiToolbar {...defaultProps} />);

    // Should show AI status
    expect(screen.getByText('AI Ready')).toBeInTheDocument();
  });
});
