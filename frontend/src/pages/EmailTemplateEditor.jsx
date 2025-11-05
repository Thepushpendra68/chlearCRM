import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import emailService from '../services/emailService';
import toast from 'react-hot-toast';
import Editor from '@monaco-editor/react';
import { getCurrentUserProfile, uploadFile } from '../config/supabase';
import supabase from '../config/supabase';
// GrapesJS styles for visual editor
import 'grapesjs/dist/css/grapes.min.css';
import EmailAiToolbar from '../components/EmailAiToolbar';
import {
  CodeBracketIcon,
  PaintBrushIcon,
  EyeIcon,
  ArrowLeftIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Default MJML template
const DEFAULT_MJML = `<mjml>
  <mj-head>
    <mj-title>Welcome Email</mj-title>
    <mj-preview>Welcome to our platform!</mj-preview>
  </mj-head>
  <mj-body>
    <mj-section>
      <mj-column>
        <mj-text font-size="20px" color="#000000" font-family="Helvetica, Arial, sans-serif">
          Hello {{lead.name}},
        </mj-text>
        <mj-text font-size="16px" color="#555555" font-family="Helvetica, Arial, sans-serif">
          Welcome to our platform! We're excited to have you on board.
        </mj-text>
        <mj-button background-color="#2563eb" href="https://yoursite.com">
          Get Started
        </mj-button>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`;

const EmailTemplateEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [compiling, setCompiling] = useState(false);
  
  // Template metadata
  const [templateData, setTemplateData] = useState({
    name: '',
    subject: '',
    category: 'general',
    folder: '',
    description: '',
    is_active: true
  });

  // Editor state
  const [editorMode, setEditorMode] = useState('code'); // 'code' or 'visual'
  const [codeEditorKey, setCodeEditorKey] = useState(0);
  const [mjmlContent, setMjmlContent] = useState(DEFAULT_MJML);
  const [htmlContent, setHtmlContent] = useState('');
  const [designJson, setDesignJson] = useState(null);
  
  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');

  // GrapesJS
  const editorRef = useRef(null);
  const grapesEditorRef = useRef(null);

  useEffect(() => {
    if (!isNew) {
      fetchTemplate();
    }
  }, [id]);

  useEffect(() => {
    // Initialize GrapesJS when switching to visual mode
    if (editorMode === 'visual' && !grapesEditorRef.current) {
      // Add small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        initGrapesJS();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editorMode]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const resp = await emailService.getTemplate(id);
      const template = resp?.data || resp;

      // Determine base version: prefer published, otherwise latest
      let baseVersion = null;
      if (template.published_version) {
        baseVersion = template.published_version;
      } else if (template.latest_version) {
        baseVersion = template.latest_version;
      } else if (template.versions && template.versions.length > 0) {
        baseVersion = template.versions[0];
      }

      setTemplateData(prev => ({
        name: template.name,
        subject: (baseVersion && baseVersion.subject) ? baseVersion.subject : (template.subject || prev.subject || ''),
        category: template.category || 'general',
        folder: template.folder || '',
        description: template.description || '',
        is_active: template.is_active
      }));

      // Load version content if available
      if (baseVersion) {
        // Prefer MJML when present; otherwise show saved HTML in code editor to maintain parity
        const nextCodeContent = baseVersion.mjml || baseVersion.html || DEFAULT_MJML;
        setMjmlContent(nextCodeContent);
        setHtmlContent(baseVersion.html || '');
        setDesignJson(baseVersion.json_design || null);
      }
    } catch (error) {
      console.error('Error fetching template:', error);
      toast.error('Failed to load template');
      navigate('/app/email/templates');
    } finally {
      setLoading(false);
    }
  };

  const initGrapesJS = async () => {
    try {
      console.log('Initializing GrapesJS...');
      
      // Check if container exists
      const container = document.querySelector('#gjs-editor');
      if (!container) {
        console.error('GrapesJS container not found');
        toast.error('Visual editor container not ready');
        return;
      }

      // Dynamic import to avoid SSR issues
      const grapesjs = (await import('grapesjs')).default;
      console.log('GrapesJS loaded:', !!grapesjs);

      // Try to load newsletter preset
      let preset = null;
      try {
        preset = (await import('grapesjs-preset-newsletter')).default;
        console.log('Newsletter preset loaded:', !!preset);
      } catch (err) {
        console.warn('Newsletter preset not available, using basic editor:', err);
      }

      // Custom upload handler - uploads to Supabase email-assets bucket
      const uploadHandler = async (files, dropData = null) => {
        try {
          const { profile } = await getCurrentUserProfile();
          const companyId = profile?.company_id || 'default';
          const uploaded = [];
          
          for (const file of files) {
            // Create short filename
            const ext = file.name.split('.').pop().toLowerCase();
            const base = file.name.replace(/\.[^/.]+$/, '').slice(0, 8).replace(/[^a-zA-Z0-9]/g, '');
            const timestamp = Date.now().toString(36);
            const shortName = `${timestamp}-${base}.${ext}`;
            
            // Upload to email-assets bucket
            const filePath = `${companyId}/${shortName}`;
            
            const { data, error } = await supabase.storage
              .from('email-assets')
              .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false,
              });

            if (error) {
              console.error('Upload error:', error);
              toast.error(`Failed to upload ${file.name}: ${error.message}`);
              continue;
            }

            // Get public URL
            const { data: urlData } = supabase.storage
              .from('email-assets')
              .getPublicUrl(filePath);

            if (urlData?.publicUrl) {
              uploaded.push({ src: urlData.publicUrl, name: shortName, type: 'image' });
            }
          }

          if (uploaded.length > 0) {
            const editorInst = grapesEditorRef.current;
            editorInst?.AssetManager.add(uploaded);

            // If dropped on canvas, place/replace the first image directly
            if (dropData) {
              const first = uploaded[0];
              const selected = editorInst.getSelected();
              if (selected && selected.is('image')) {
                selected.addAttributes({ src: first.src });
              } else {
                editorInst.addComponents(`<img src="${first.src}" style="max-width: 100%;" />`);
              }
            }
            toast.success(`Uploaded ${uploaded.length} image(s)`);
          } else {
            toast.error('No images were uploaded');
          }
        } catch (err) {
          console.error('Asset upload error:', err);
          toast.error('Failed to upload: ' + err.message);
        }
      };

      const config = {
        container: '#gjs-editor',
        height: '600px',
        width: 'auto',
        storageManager: false,
        fromElement: false,
        assetManager: {
          upload: false,
          autoAdd: true,
          uploadFile: async (e) => {
            const files = e.dataTransfer?.files || e.target?.files || [];
            if (files.length > 0) {
              await uploadHandler(Array.from(files));
            }
          }
        },
        canvas: {
          styles: [],
          scripts: []
        }
      };

      // Add preset plugin if available
      if (preset) {
        config.plugins = [preset];
        config.pluginsOpts = {
          [preset]: {}
        };
      }

      console.log('Initializing editor with config:', config);
      const editor = grapesjs.init(config);
      console.log('GrapesJS editor initialized:', !!editor);

      // Override the asset manager's upload behavior entirely
      const am = editor.AssetManager;
      
      // Hook into the asset manager's container for drops
      setTimeout(() => {
        // Find the asset manager drop zone
        const assetContainer = document.querySelector('.gjs-am-assets-cont') || 
                               document.querySelector('#gjs-editor .gjs-am-assets') ||
                               document.querySelector('#gjs-am-uploadFile');
        
        if (assetContainer) {
          console.log('Found asset container, wiring drop handler');
          
          // Prevent default drag behaviors
          ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            assetContainer.addEventListener(eventName, (e) => {
              e.preventDefault();
              e.stopPropagation();
            }, false);
          });

          // Handle drop
          assetContainer.addEventListener('drop', async (e) => {
            const files = e.dataTransfer?.files;
            console.log('[Asset Manager Drop] Received files:', files?.length || 0);
            if (files && files.length > 0) {
              await uploadHandler(Array.from(files));
            }
          }, false);
        }

        // Also wire the file input button
        const fileInput = document.querySelector('#gjs-editor input[type="file"]');
        if (fileInput) {
          console.log('Found file input, wiring change handler');
          fileInput.addEventListener('change', async (e) => {
            console.log('[File Input] Selected files:', e.target.files?.length || 0);
            if (e.target.files && e.target.files.length > 0) {
              await uploadHandler(Array.from(e.target.files));
            }
          });
        }
      }, 1500);

      // Handle canvas drops for direct image placement
      editor.on('canvas:drop', async (data) => {
        const files = data?.dataTransfer?.files;
        console.log('[Canvas Drop] Received files:', files?.length || 0);
        if (files && files.length > 0) {
          await uploadHandler(Array.from(files), data);
        }
      });

      // Load existing design if available, otherwise use saved HTML
      if (!designJson || Object.keys(designJson).length === 0) {
        if (htmlContent && htmlContent.trim().length > 0) {
          // Strip global <style> from start if present and keep it within canvas
          // GrapesJS supports styles via setStyle or inline; we include as-is for simplicity
          editor.setComponents('');
          editor.addComponents(htmlContent);
        } else {
          // Final fallback: minimal starter
          editor.addComponents(`
            <div style="padding: 20px; font-family: Arial, sans-serif;">
              <h1>New Email</h1>
              <p>Hello {{lead.name}},</p>
            </div>
          `);
        }
      } else {
        // Load existing design if available
        try {
          editor.loadProjectData(designJson);
        } catch (error) {
          console.error('Error loading design:', error);
          toast.error('Could not load saved design');
        }
      }

      grapesEditorRef.current = editor;
      console.log('GrapesJS setup complete');
    } catch (error) {
      console.error('Error initializing GrapesJS:', error);
      toast.error('Failed to initialize visual editor: ' + error.message);
    }
  };

  const ensureMjmlDocument = (content) => {
    const hasRoot = /<\s*mjml[\s>]/i.test(content || '');
    if (hasRoot) return content;
    // Auto-wrap plain HTML/text into a minimal MJML document for compilation
    const safe = (content || '').trim() || 'Hello {{lead.name}}';
    return `\n<mjml>\n  <mj-body>\n    <mj-section>\n      <mj-column>\n        <mj-text>${safe}</mj-text>\n      </mj-column>\n    </mj-section>\n  </mj-body>\n</mjml>`;
  };

  const isFullHtml = (content) => /<\s*html[\s>]/i.test(content || '');
  const isMjmlDocument = (content) => /<\s*mjml[\s>]/i.test(content || '');
  const isHtmlFragment = (content) => /<\s*(div|span|table|tr|td|p|style|section|header|footer|h1|h2|h3|h4|h5|h6|img)[\s>]/i.test(content || '');

  const handleCompileMJML = async () => {
    try {
      setCompiling(true);
      // If user provided full HTML, accept it as-is for previewing purposes
      if (isFullHtml(mjmlContent)) {
        setHtmlContent(mjmlContent);
        toast.success('HTML ready for preview.');
        return;
      }
      const toCompile = ensureMjmlDocument(mjmlContent);
      console.log('Compiling MJML:', toCompile.substring(0, 200));
      const response = await emailService.compileMJML(toCompile);
      console.log('Compilation response:', response);
      if (!response || !response.html) {
        throw new Error('No HTML returned from compiler');
      }
      setHtmlContent(response.html);
      toast.success('MJML compiled successfully!');
    } catch (error) {
      console.error('Error compiling MJML:', error);
      console.error('Full error:', JSON.stringify(error, null, 2));
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to compile MJML';
      toast.error(msg);
    } finally {
      setCompiling(false);
    }
  };

  const handlePreview = async () => {
    // If in code mode, try MJML compile; if it fails, fallback to visual HTML when available
    if (editorMode === 'code') {
      const hasContent = typeof mjmlContent === 'string' && mjmlContent.trim().length > 0;
      if (hasContent) {
        try {
          // If it's full HTML, preview directly without MJML compile
          if (isFullHtml(mjmlContent)) {
            console.log('Previewing full HTML directly');
            setPreviewHtml(mjmlContent);
            setShowPreview(true);
            return;
          }
          const toCompile = ensureMjmlDocument(mjmlContent);
          console.log('Compiling for preview:', toCompile.substring(0, 200));
          const response = await emailService.compileMJML(toCompile);
          console.log('Preview compilation response:', response);
          if (!response?.html) throw new Error('Empty HTML from compiler');
          setPreviewHtml(response.html);
          setShowPreview(true);
          return;
        } catch (error) {
          console.error('Preview error:', error);
          console.error('Full preview error:', JSON.stringify(error, null, 2));
          // Fallback to visual editor HTML if available
          if (grapesEditorRef.current) {
            const html = grapesEditorRef.current.getHtml();
            const css = grapesEditorRef.current.getCss();
            if (html) {
              setPreviewHtml(`<style>${css}</style>${html}`);
              toast.success('Showing visual preview (MJML had errors).');
              setShowPreview(true);
              return;
            }
          }
          const msg = error?.response?.data?.error || 'Please fix MJML errors before previewing';
          toast.error(msg);
          return;
        }
      } else {
        // No MJML present; attempt visual fallback if editor exists
        if (grapesEditorRef.current) {
          const html = grapesEditorRef.current.getHtml();
          const css = grapesEditorRef.current.getCss();
          if (html) {
            setPreviewHtml(`<style>${css}</style>${html}`);
            setShowPreview(true);
            return;
          }
        }
        toast.error('No content to preview. Add MJML or use Visual editor.');
        return;
      }
    } else {
      // Visual mode: render directly from GrapesJS
      if (!grapesEditorRef.current) {
        toast.error('Editor not ready. Please wait a moment and try again.');
        return;
      }
      const html = grapesEditorRef.current.getHtml();
      const css = grapesEditorRef.current.getCss();
      if (!html) {
        toast.error('No content to preview. Please add blocks in the visual editor.');
        return;
      }
      setPreviewHtml(`<style>${css}</style>${html}`);
      setShowPreview(true);
    }
  };


  const insertHtmlIntoVisual = async (html, subject = '') => {
    try {
      // Ensure visual editor is ready
      if (!grapesEditorRef.current) {
        setEditorMode('visual');
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      if (!grapesEditorRef.current) {
        toast.error('Visual editor not ready. Try again in a moment.');
        return;
      }
      const editor = grapesEditorRef.current;

      // Clear current canvas and insert new HTML
      try { editor.DomComponents.clear(); } catch {}
      editor.setComponents('');
      editor.addComponents(html);

      if (subject && (!templateData.subject || templateData.subject.trim().length === 0)) {
        setTemplateData(prev => ({ ...prev, subject }));
      }

      toast.success('Inserted AI content into visual editor');
    } catch (err) {
      console.error('Error inserting into visual editor:', err);
      toast.error('Could not insert content into visual editor');
    }
  };

  const syncVisualFromCode = async () => {
    try {
      let html = '';
      if (isFullHtml(mjmlContent)) {
        html = mjmlContent;
      } else {
        const toCompile = ensureMjmlDocument(mjmlContent);
        const compiled = await emailService.compileMJML(toCompile);
        html = compiled?.html || '';
      }
      if (!html) {
        toast.error('No content to load into visual editor');
        return;
      }
      await insertHtmlIntoVisual(html, templateData.subject);
    } catch (err) {
      console.error('Error syncing visual from code:', err);
      toast.error('Could not load code into visual editor');
    }
  };


  const handleSave = async (andPublish = false) => {
    if (!templateData.name) {
      toast.error('Template name is required');
      return;
    }

    if (!templateData.subject) {
      toast.error('Email subject is required');
      return;
    }

    try {
      setSaving(true);
      console.log('Starting save process...', { editorMode, andPublish });

      let templateId = id;

      // Create or update template metadata
      if (isNew) {
        console.log('Creating new template:', templateData);
        const createdResp = await emailService.createTemplate(templateData);
        console.log('Template created:', createdResp);
        templateId = createdResp?.data?.id || createdResp?.id;
        if (!templateId) throw new Error('No template ID returned');
        toast.success('Template created!');
      } else {
        console.log('Updating template:', id);
        await emailService.updateTemplate(id, templateData);
        toast.success('Template updated!');
      }

      // Save version
      let versionData = {};
      
      if (editorMode === 'code') {
        console.log('Saving code mode version');
        // Handle different content types
        if (isFullHtml(mjmlContent)) {
          // Pure HTML
          versionData = {
            editor_type: 'code',
            subject: templateData.subject,
            mjml: null,
            html: mjmlContent,
            json_design: null
          };
        } else if (isMjmlDocument(mjmlContent)) {
          // MJML - compile to HTML
          const compiled = await emailService.compileMJML(mjmlContent);
          if (!compiled?.html) throw new Error('Failed to compile MJML');
          versionData = {
            editor_type: 'code',
            subject: templateData.subject,
            mjml: mjmlContent,
            html: compiled.html,
            json_design: null
          };
        } else if (isHtmlFragment(mjmlContent)) {
          // HTML fragment (no <html>), save as HTML as-is
          versionData = {
            editor_type: 'code',
            subject: templateData.subject,
            mjml: null,
            html: mjmlContent,
            json_design: null
          };
        } else {
          // Plain text: wrap and compile as MJML
          const toCompile = ensureMjmlDocument(mjmlContent);
          const compiled = await emailService.compileMJML(toCompile);
          if (!compiled?.html) throw new Error('Failed to compile MJML');
          versionData = {
            editor_type: 'code',
            subject: templateData.subject,
            mjml: toCompile,
            html: compiled.html,
            json_design: null
          };
        }
      } else {
        console.log('Saving visual mode version');
        // Get data from GrapesJS
        if (!grapesEditorRef.current) {
          throw new Error('Visual editor not initialized');
        }
        
        const html = grapesEditorRef.current.getHtml();
        const css = grapesEditorRef.current.getCss();
        const projectData = grapesEditorRef.current.getProjectData();
        
        if (!html || html.trim().length === 0) {
          throw new Error('No content in visual editor');
        }
        
        versionData = {
          editor_type: 'dragdrop',
          subject: templateData.subject,
          mjml: null,
          html: `<style>${css}</style>${html}`,
          json_design: projectData
        };
      }

      console.log('Creating version with data:', { templateId, versionData });
      const versionResp = await emailService.createVersion(templateId, versionData);
      console.log('Version created:', versionResp);
      
      const versionId = versionResp?.data?.id || versionResp?.id;
      if (!versionId) throw new Error('No version ID returned');
      
      // Publish if requested
      if (andPublish) {
        console.log('Publishing version:', versionId);
        await emailService.publishVersion(versionId);
        toast.success('Template published!');
      } else {
        toast.success('Draft saved!');
      }

      // Navigate to templates list
      console.log('Save complete, navigating back');
      navigate('/app/email/templates');
    } catch (error) {
      console.error('Error saving template:', error);
      console.error('Error details:', {
        message: error?.message,
        response: error?.response?.data,
        status: error?.response?.status
      });
      const respData = error?.response?.data;
      let msg = respData?.message || respData?.error || error?.message || 'Failed to save template';
      if (typeof msg === 'object') {
        msg = respData?.error?.message || JSON.stringify(respData);
      }
      toast.error('Save failed: ' + msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/app/email/templates');
                }
              }}
              className="btn-secondary"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {isNew ? 'New Email Template' : 'Edit Email Template'}
              </h1>
              {!isNew && (
                <p className="text-sm text-gray-600">{templateData.name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* AI Toolbar */}
            <EmailAiToolbar 
              templateData={templateData}
              setTemplateData={setTemplateData}
              mjmlContent={mjmlContent}
              setMjmlContent={setMjmlContent}
              htmlContent={htmlContent}
              editorMode={editorMode}
              onInsertVisualHtml={insertHtmlIntoVisual}
            />

            {/* Editor Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={async () => {
                  // If leaving visual mode, sync visual design into code editor as HTML
                  if (grapesEditorRef.current) {
                    try {
                      const html = grapesEditorRef.current.getHtml();
                      const css = grapesEditorRef.current.getCss();
                      if (html) {
                        setMjmlContent(`<style>${css}</style>${html}`);
                        setHtmlContent(`<style>${css}</style>${html}`);
                      }
                    } catch {}
                    try { grapesEditorRef.current.destroy(); } catch {}
                    grapesEditorRef.current = null;
                  }
                  setEditorMode('code');
                  // Force-remount Monaco so it renders correctly
                  setCodeEditorKey((k) => k + 1);
                }}
                className={`px-4 py-2 rounded flex items-center space-x-2 transition-colors ${
                  editorMode === 'code'
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <CodeBracketIcon className="h-5 w-5" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  await syncVisualFromCode();
                }}
                className={`px-4 py-2 rounded flex items-center space-x-2 transition-colors ${
                  editorMode === 'visual'
                    ? 'bg-white shadow-sm text-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <PaintBrushIcon className="h-5 w-5" />
                <span>Visual</span>
              </button>
            </div>

            <button type="button" onClick={handlePreview} className="btn-secondary">
              <EyeIcon className="h-5 w-5 mr-2" />
              Preview
            </button>

            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="btn-secondary"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>

            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="btn-primary"
            >
              <CheckIcon className="h-5 w-5 mr-2" />
              {saving ? 'Publishing...' : 'Save & Publish'}
            </button>
          </div>
        </div>

        {/* Template Info Form */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Template Name *"
            value={templateData.name}
            onChange={(e) => setTemplateData({ ...templateData, name: e.target.value })}
            className="input"
          />
          <input
            type="text"
            placeholder="Email Subject *"
            value={templateData.subject}
            onChange={(e) => setTemplateData({ ...templateData, subject: e.target.value })}
            className="input"
          />
          <select
            value={templateData.category}
            onChange={(e) => setTemplateData({ ...templateData, category: e.target.value })}
            className="input"
          >
            <option value="general">General</option>
            <option value="welcome">Welcome</option>
            <option value="follow-up">Follow-up</option>
            <option value="newsletter">Newsletter</option>
            <option value="promotional">Promotional</option>
          </select>
          <input
            type="text"
            placeholder="Folder (optional)"
            value={templateData.folder}
            onChange={(e) => setTemplateData({ ...templateData, folder: e.target.value })}
            className="input"
          />
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden">
        {editorMode === 'code' ? (
          <div className="h-full flex flex-col">
            <div className="bg-gray-50 border-b px-6 py-3 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <strong>Merge Variables:</strong> {'{'}{'{'} lead.name {'}'}{'}'}, {'{'}{'{'} lead.email {'}'}{'}'}, {'{'}{'{'} lead.company {'}'}{'}'}, {'{'}{'{'} lead.phone {'}'}{'}'}
              </div>
              <button
                type="button"
                onClick={handleCompileMJML}
                disabled={compiling}
                className="btn-secondary text-sm"
              >
                {compiling ? 'Compiling...' : 'Compile MJML'}
              </button>
            </div>
            <div className="flex-1">
              <Editor
                key={codeEditorKey}
                height="100%"
                defaultLanguage="html"
                value={mjmlContent}
                onChange={(value) => setMjmlContent(value || '')}
                theme="vs-light"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true
                }}
              />
            </div>
          </div>
        ) : (
          <div id="gjs-editor" className="h-full w-full bg-white" style={{ minHeight: '600px' }}></div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Email Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="bg-white max-w-2xl mx-auto shadow-lg">
                <div
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  className="email-preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplateEditor;

