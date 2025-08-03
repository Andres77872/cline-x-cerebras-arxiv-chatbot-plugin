// Standalone Resume Component
// Creates an independent resume interface for arXiv papers with streaming text generation

window.ArxivChatbot = window.ArxivChatbot || {};
window.ArxivChatbot.Resume = class {
    constructor() {
        this.apiClient = null;
        this.onShowMessage = null;
        this.resumeWindow = null;
        this.resumeContainer = null;
        this.textContainer = null;
        this.controlsContainer = null;
        this.statusContainer = null;
        this.isGenerating = false;
        this.arxivPaperUrl = null;
        this.paperInfo = null;
        this.currentResumeText = '';
    }

    // Initialize with dependencies
    initialize(apiClient, onShowMessage) {
        this.apiClient = apiClient;
        this.onShowMessage = onShowMessage;
    }

    // Create and show standalone resume interface
    async createStandaloneResume(paperInfo) {
        if (!paperInfo || !paperInfo.url) {
            this.onShowMessage?.('Please provide valid paper information', 'error');
            return false;
        }

        // Close existing resume window if open
        this.closeResumeWindow();

        this.paperInfo = paperInfo;
        this.arxivPaperUrl = paperInfo.url;

        // Create and setup the resume window
        this.createResumeWindow();
        this.setupResumeUI();
        this.setupControlEventListeners();

        return true;
    }

    // Create the standalone resume window
    createResumeWindow() {
        // Create overlay background
        this.resumeWindow = document.createElement('div');
        this.resumeWindow.id = 'arxiv-resume-window';
        this.resumeWindow.innerHTML = `
            <div class="arxiv-resume-overlay">
                <div class="arxiv-resume-modal">
                    <div class="arxiv-resume-header">
                        <h2>📄 arXiv Paper Resume</h2>
                        <button class="arxiv-resume-close" id="resume-close-btn">×</button>
                    </div>
                    <div class="arxiv-resume-content" id="resume-content">
                        <!-- Content will be populated by setupResumeUI -->
                    </div>
                </div>
            </div>
        `;

        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #arxiv-resume-window {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 10001;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            }

            .arxiv-resume-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(5px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                box-sizing: border-box;
            }

            .arxiv-resume-modal {
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                width: 100%;
                max-width: 900px;
                max-height: 90vh;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }

            .arxiv-resume-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-radius: 12px 12px 0 0;
            }

            .arxiv-resume-header h2 {
                margin: 0;
                font-size: 24px;
                font-weight: 600;
            }

            .arxiv-resume-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                font-size: 24px;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background-color 0.2s;
            }

            .arxiv-resume-close:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .arxiv-resume-content {
                padding: 20px;
                flex: 1;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }

            .resume-paper-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                border-left: 4px solid #007bff;
            }

            .resume-paper-title {
                font-weight: 600;
                color: #333;
                margin-bottom: 5px;
            }

            .resume-paper-url {
                color: #007bff;
                text-decoration: none;
                font-size: 14px;
            }

            .resume-controls {
                display: flex;
                gap: 10px;
                align-items: center;
                justify-content: center;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }

            .resume-btn {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .resume-btn:hover:not(:disabled) {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
            }

            .resume-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }

            .resume-status {
                background: #e3f2fd;
                border: 1px solid #bbdefb;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
                color: #1976d2;
                font-weight: 500;
            }

            .resume-text-container {
                background: #ffffff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                min-height: 300px;
                font-family: 'Georgia', serif;
                line-height: 1.6;
                color: #333;
                overflow-y: auto;
                max-height: 400px;
            }

            .resume-text-container h1, .resume-text-container h2, .resume-text-container h3 {
                color: #2c3e50;
                margin-top: 20px;
                margin-bottom: 10px;
            }

            .resume-text-container h1 {
                font-size: 24px;
                border-bottom: 2px solid #3498db;
                padding-bottom: 5px;
            }

            .resume-text-container h2 {
                font-size: 20px;
                color: #34495e;
            }

            .resume-text-container h3 {
                font-size: 18px;
                color: #7f8c8d;
            }

            .resume-text-container p {
                margin-bottom: 15px;
                text-align: justify;
            }

            .resume-text-container em {
                font-style: italic;
                color: #666;
            }

            .resume-text-container strong {
                font-weight: bold;
                color: #2c3e50;
            }

            .resume-streaming-indicator {
                display: inline-block;
                width: 8px;
                height: 8px;
                background: #007bff;
                border-radius: 50%;
                animation: pulse 1.5s infinite;
                margin-left: 5px;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.3; }
                100% { opacity: 1; }
            }

            .resume-empty-state {
                text-align: center;
                color: #666;
                font-style: italic;
                padding: 40px 20px;
            }
        `;

        this.resumeWindow.appendChild(style);
        document.body.appendChild(this.resumeWindow);

        // Close on overlay click
        this.resumeWindow.querySelector('.arxiv-resume-overlay').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeResumeWindow();
            }
        });

        // Close on X button click
        this.resumeWindow.querySelector('#resume-close-btn').addEventListener('click', () => {
            this.closeResumeWindow();
        });

        // Prevent body scrolling when modal is open
        document.body.style.overflow = 'hidden';
    }

    // Close the resume window
    closeResumeWindow() {
        if (this.resumeWindow) {
            document.body.removeChild(this.resumeWindow);
            this.resumeWindow = null;
            document.body.style.overflow = '';
        }

        // Stop any ongoing generation
        this.isGenerating = false;
    }

    // Check if resume window is open
    isResumeWindowOpen() {
        return this.resumeWindow !== null && document.body.contains(this.resumeWindow);
    }

    // Start resume generation (called when Generate is clicked)
    async startResumeGeneration() {
        if (this.isGenerating) {
            this.onShowMessage?.('Resume generation already in progress', 'warning');
            return;
        }

        if (!this.arxivPaperUrl) {
            this.onShowMessage?.('No arXiv paper URL provided', 'error');
            return;
        }

        this.isGenerating = true;
        this.currentResumeText = '';
        this.updateControls();

        try {
            await this.streamResumeGeneration(this.arxivPaperUrl);
        } catch (error) {
            console.error('Resume generation failed:', error);
        } finally {
            this.isGenerating = false;
            this.updateControls();
        }
    }

    // Setup the resume UI container
    setupResumeUI() {
        const contentContainer = this.resumeContainer = this.resumeWindow.querySelector('#resume-content');
        
        // Paper info section
        const paperInfoHtml = `
            <div class="resume-paper-info">
                <div class="resume-paper-title">${this.paperInfo.title || 'arXiv Paper'}</div>
                <a href="${this.arxivPaperUrl}" target="_blank" class="resume-paper-url">${this.arxivPaperUrl}</a>
            </div>
        `;

        // Controls section
        const controlsHtml = `
            <div class="resume-controls" id="resume-controls">
                <button class="resume-btn" id="generate-resume-btn">
                    📄 Generate Resume
                </button>
                <button class="resume-btn" id="clear-resume-btn" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    🗑️ Clear
                </button>
            </div>
        `;

        // Status section
        const statusHtml = `
            <div class="resume-status" id="resume-status">
                Ready to generate resume
            </div>
        `;

        // Text container
        const textHtml = `
            <div class="resume-text-container" id="resume-text-container">
                <div class="resume-empty-state">
                    Click "Generate Resume" to create a comprehensive summary of this arXiv paper
                </div>
            </div>
        `;

        contentContainer.innerHTML = paperInfoHtml + controlsHtml + statusHtml + textHtml;

        // Store references
        this.controlsContainer = contentContainer.querySelector('#resume-controls');
        this.statusContainer = contentContainer.querySelector('#resume-status');
        this.textContainer = contentContainer.querySelector('#resume-text-container');
    }

    // Setup event listeners for resume controls
    setupControlEventListeners() {
        const generateBtn = this.resumeWindow.querySelector('#generate-resume-btn');
        const clearBtn = this.resumeWindow.querySelector('#clear-resume-btn');

        generateBtn.addEventListener('click', () => {
            this.startResumeGeneration();
        });

        clearBtn.addEventListener('click', () => {
            this.clearResume();
        });
    }

    // Stream resume generation from API
    async streamResumeGeneration(arxivPaperUrl) {
        const statusElement = this.statusContainer;
        
        try {
            if (!this.apiClient) {
                throw new Error('API client not initialized');
            }

            statusElement.textContent = '📄 Starting resume generation...';
            
            // Clear previous content
            this.textContainer.innerHTML = '';
            this.currentResumeText = '';

            // Get session token first
            const sessionData = await this.getSessionToken();
            if (!sessionData || !sessionData.sessionToken) {
                throw new Error('No valid session token found. Please ensure you are logged in.');
            }

            console.log('Making request to resume API...');
            
            // Use the same API pattern as podcast module for streaming
            const response = await fetch('http://127.0.0.1:8051/resume/resume/generate/stream', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${sessionData.sessionToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    arxiv_paper_url: arxivPaperUrl
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            statusElement.textContent = '📄 Streaming resume generation...';

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    statusElement.textContent = '✅ Resume generated successfully!';
                    this.removeStreamingIndicator();
                    break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            this.handleResumeData(data);
                        } catch (parseError) {
                            console.error('Failed to parse streaming data:', parseError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            
            // Provide specific guidance for common errors
            let errorMessage = '❌ Error generating resume';
            let userGuidance = '';
            
            if (error.message && error.message.includes('Failed to fetch')) {
                errorMessage = '🚫 Request blocked by browser';
                userGuidance = 'This error is typically caused by browser extensions. Please:\n' +
                             '1. Disable ad blockers/privacy extensions temporarily\n' +
                             '2. Check if uBlock Origin, AdBlock, or similar extensions are active\n' +
                             '3. Add 127.0.0.1:8051 to your extension\'s whitelist\n' +
                             '4. Try opening in an incognito window with extensions disabled';
            } else if (error.message && error.message.includes('HTTP error')) {
                errorMessage = '🌐 Server error';
                userGuidance = 'The API server returned an error. Please check that the server is running correctly.';
            } else if (error.message && error.message.includes('session token')) {
                errorMessage = '🔑 Authentication error';
                userGuidance = 'Please ensure you are logged in to the extension.';
            }
            
            statusElement.textContent = errorMessage;
            
            // Show user guidance if available
            if (userGuidance && this.onShowMessage) {
                this.onShowMessage(userGuidance, 'warning');
            }
            
            throw error;
        }
    }

    // Handle individual resume data chunks
    handleResumeData(data) {
        if (data.type === 'status') {
            // Update status
            this.statusContainer.textContent = `📄 ${data.content}`;
        } else if (data.type === 'text' && data.section === 'final_resume') {
            // Handle text content for final resume
            this.handleTextContent(data.content);
        }
    }

    // Handle text content streaming
    handleTextContent(content) {
        this.currentResumeText += content;
        
        // Add streaming indicator if not present
        this.addStreamingIndicator();
        
        // Update the text display
        this.updateTextDisplay();
    }

    // Update text display with current resume text
    updateTextDisplay() {
        if (!this.textContainer) return;
        
        // Convert markdown-like formatting to HTML
        let formattedText = this.currentResumeText
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Handle headings (assume lines ending with : are headings)
        formattedText = formattedText.replace(/<p>([^<]+?):<\/p>/g, '<h2>$1</h2>');
        
        // Handle title (first line is often the title)
        if (formattedText.startsWith('<p>Title:')) {
            formattedText = formattedText.replace('<p>Title: ', '<h1>').replace('</p>', '</h1>');
        }

        this.textContainer.innerHTML = formattedText + '<span class="resume-streaming-indicator"></span>';
        
        // Auto-scroll to bottom
        this.textContainer.scrollTop = this.textContainer.scrollHeight;
    }

    // Add streaming indicator
    addStreamingIndicator() {
        const existingIndicator = this.textContainer.querySelector('.resume-streaming-indicator');
        if (!existingIndicator) {
            // Will be added in updateTextDisplay
        }
    }

    // Remove streaming indicator
    removeStreamingIndicator() {
        const indicator = this.textContainer.querySelector('.resume-streaming-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // Get session token from Chrome storage
    async getSessionToken() {
        return new Promise((resolve) => {
            if (chrome && chrome.storage && chrome.storage.local) {
                chrome.storage.local.get(['sessionToken'], (result) => {
                    resolve(result);
                });
            } else {
                resolve(null);
            }
        });
    }

    // Clear current resume
    clearResume() {
        this.currentResumeText = '';
        this.textContainer.innerHTML = `
            <div class="resume-empty-state">
                Click "Generate Resume" to create a comprehensive summary of this arXiv paper
            </div>
        `;
        this.statusContainer.textContent = 'Ready to generate resume';
    }

    // Update control button states
    updateControls() {
        const generateBtn = this.resumeWindow?.querySelector('#generate-resume-btn');
        if (generateBtn) {
            generateBtn.disabled = this.isGenerating;
            generateBtn.textContent = this.isGenerating ? '⏳ Generating...' : '📄 Generate Resume';
        }
    }

    // Get current resume state
    getResumeState() {
        return {
            isGenerating: this.isGenerating,
            paperUrl: this.arxivPaperUrl,
            paperInfo: this.paperInfo,
            resumeText: this.currentResumeText,
            isWindowOpen: this.isResumeWindowOpen()
        };
    }
};

// Export the class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.ArxivChatbot.Resume;
}
