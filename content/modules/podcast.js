// Standalone Podcast Component
// Creates an independent podcast interface for arXiv papers with streaming text and audio playback

window.ArxivChatbot = window.ArxivChatbot || {};
window.ArxivChatbot.Podcast = class {
    constructor() {
        this.apiClient = null;
        this.onShowMessage = null;
        this.currentAudioContext = null;
        this.audioQueue = [];
        this.isPlaying = false;
        this.podcastWindow = null;
        this.podcastContainer = null;
        this.textContainer = null;
        this.controlsContainer = null;
        this.currentSegments = [];
        this.isGenerating = false;
        this.arxivPaperUrl = null;
        this.paperInfo = null;
    }

    // Initialize with dependencies
    initialize(apiClient, onShowMessage) {
        this.apiClient = apiClient;
        this.onShowMessage = onShowMessage;
        this.initializeAudioContext();
    }

    // Initialize Web Audio API context
    initializeAudioContext() {
        try {
            this.currentAudioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
            this.onShowMessage?.('Audio playback not supported in this browser', 'error');
        }
    }

    // Create and show standalone podcast interface
    async createStandalonePodcast(paperInfo) {
        if (!paperInfo || !paperInfo.url) {
            this.onShowMessage?.('Please provide valid paper information', 'error');
            return false;
        }

        // Close existing podcast window if open
        this.closePodcastWindow();

        this.paperInfo = paperInfo;
        this.arxivPaperUrl = paperInfo.url;
        this.currentSegments = [];

        try {
            await this.createPodcastWindow();
            await this.setupPodcastUI();
            this.updateControls();
            this.onShowMessage?.('Podcast interface created successfully', 'success');
            return true;
        } catch (error) {
            console.error('Podcast interface creation error:', error);
            this.onShowMessage?.(`Failed to create podcast interface: ${error.message}`, 'error');
            return false;
        }
    }

    // Create the standalone podcast window
    createPodcastWindow() {
        // Create overlay backdrop
        const backdrop = document.createElement('div');
        backdrop.id = 'podcast-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(5px);
        `;

        // Create podcast window
        this.podcastWindow = document.createElement('div');
        this.podcastWindow.id = 'standalone-podcast-window';
        this.podcastWindow.style.cssText = `
            background: #1a1a2e;
            border-radius: 20px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 1px solid #333;
            position: relative;
        `;

        // Add close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            font-size: 28px;
            color: #fff;
            cursor: pointer;
            z-index: 1;
            padding: 0;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        closeButton.onmouseover = () => {
            closeButton.style.background = 'rgba(255, 255, 255, 0.1)';
        };
        closeButton.onmouseout = () => {
            closeButton.style.background = 'none';
        };
        closeButton.onclick = () => this.closePodcastWindow();

        // Container for podcast content
        this.podcastContainer = document.createElement('div');
        this.podcastContainer.id = 'podcast-content-container';
        this.podcastContainer.style.cssText = `
            padding: 20px;
            color: white;
        `;

        this.podcastWindow.appendChild(closeButton);
        this.podcastWindow.appendChild(this.podcastContainer);
        backdrop.appendChild(this.podcastWindow);
        document.body.appendChild(backdrop);

        // Close on backdrop click
        backdrop.onclick = (e) => {
            if (e.target === backdrop) {
                this.closePodcastWindow();
            }
        };

        // Prevent body scroll when podcast is open
        document.body.style.overflow = 'hidden';
    }

    // Close the podcast window
    closePodcastWindow() {
        const backdrop = document.getElementById('podcast-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        this.podcastWindow = null;
        this.podcastContainer = null;
        this.stopPodcast();
        
        // Restore body scroll
        document.body.style.overflow = '';
    }

    // Check if podcast window is open
    isPodcastWindowOpen() {
        return document.getElementById('podcast-backdrop') !== null;
    }

    // Start podcast generation (called when Play is clicked)
    async startPodcastGeneration() {
        if (this.isGenerating) {
            this.onShowMessage?.('Podcast generation already in progress', 'warning');
            return;
        }

        if (!this.arxivPaperUrl) {
            this.onShowMessage?.('No arXiv paper URL available', 'error');
            return;
        }

        this.isGenerating = true;

        try {
            await this.streamPodcastGeneration(this.arxivPaperUrl);
        } catch (error) {
            console.error('Podcast generation error:', error);
            this.onShowMessage?.(`Failed to generate podcast: ${error.message}`, 'error');
        } finally {
            this.isGenerating = false;
            this.updateControls();
        }
    }

    // Setup the podcast UI container
    async setupPodcastUI() {
        if (!this.podcastContainer) return;

        // Create header with paper info
        const paperTitle = this.paperInfo?.title || 'arXiv Paper';
        
        // Handle authors - can be string or array
        let paperAuthors = 'Unknown Authors';
        if (this.paperInfo?.authors) {
            if (Array.isArray(this.paperInfo.authors)) {
                // Handle array format
                paperAuthors = this.paperInfo.authors.slice(0, 3).join(', ') + 
                              (this.paperInfo.authors.length > 3 ? ' et al.' : '');
            } else if (typeof this.paperInfo.authors === 'string') {
                // Handle string format - truncate if too long
                const authorsStr = this.paperInfo.authors;
                if (authorsStr.length > 80) {
                    paperAuthors = authorsStr.substring(0, 77) + '...';
                } else {
                    paperAuthors = authorsStr;
                }
            }
        }

        this.podcastContainer.innerHTML = `
            <div class="podcast-wrapper" style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                border-radius: 16px;
                padding: 25px;
                color: white;
                box-shadow: 0 8px 25px rgba(0,0,0,0.2);
            ">
                <div class="podcast-header" style="
                    text-align: center;
                    margin-bottom: 25px;
                    border-bottom: 1px solid rgba(255,255,255,0.2);
                    padding-bottom: 20px;
                ">
                    <h2 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 700; line-height: 1.3;">
                        🎧 Research Podcast
                    </h2>
                    <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; opacity: 0.9; line-height: 1.4;">
                        ${paperTitle}
                    </h3>
                    <p style="margin: 0; font-size: 14px; opacity: 0.7; font-style: italic;">
                        ${paperAuthors}
                    </p>
                </div>
                <div class="podcast-controls" style="
                    display: flex;
                    justify-content: center;
                    gap: 15px;
                    margin-bottom: 20px;
                    align-items: center;
                ">
                    <button id="podcast-play-pause" style="
                        background: linear-gradient(45deg, #4CAF50, #45a049);
                        border: none;
                        border-radius: 25px;
                        color: white;
                        padding: 12px 24px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">▶️ Generate & Play</button>
                    <button id="podcast-stop" style="
                        background: linear-gradient(45deg, #f44336, #d32f2f);
                        border: none;
                        border-radius: 25px;
                        color: white;
                        padding: 12px 24px;
                        cursor: pointer;
                        font-size: 14px;
                        font-weight: 600;
                        transition: all 0.3s ease;
                        box-shadow: 0 4px 15px rgba(244, 67, 54, 0.3);
                        display: flex;
                        align-items: center;
                        gap: 8px;
                    ">⏹️ Stop</button>
                </div>
                <div class="podcast-status" style="
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 15px;
                    font-size: 13px;
                ">
                    <div id="podcast-status-text">▶️ Ready to generate podcast - Click Play to start</div>
                </div>
                <div class="podcast-text-container" id="podcast-text" style="
                    background: rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 15px;
                    min-height: 100px;
                    max-height: 300px;
                    overflow-y: auto;
                    font-size: 14px;
                    line-height: 1.6;
                    white-space: pre-wrap;
                    border: 1px solid rgba(255,255,255,0.2);
                "></div>
            </div>
        `;

        this.textContainer = document.getElementById('podcast-text');
        this.controlsContainer = this.podcastContainer.querySelector('.podcast-controls');

        // Setup control event listeners
        this.setupControlEventListeners();
    }

    // Setup event listeners for podcast controls
    setupControlEventListeners() {
        const playPauseBtn = document.getElementById('podcast-play-pause');
        const stopBtn = document.getElementById('podcast-stop');

        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', async () => {
                await this.togglePlayPause();
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopPodcast();
            });
        }
    }

    // Stream podcast generation from API
    async streamPodcastGeneration(arxivPaperUrl) {
        const statusElement = document.getElementById('podcast-status-text');
        
        try {
            if (!this.apiClient) {
                throw new Error('API client not initialized');
            }

            statusElement.textContent = '🎧 Starting podcast generation...';

            // Get session token first
            const sessionData = await this.getSessionToken();
            if (!sessionData || !sessionData.sessionToken) {
                throw new Error('No valid session token found. Please ensure you are logged in.');
            }

            console.log('Making request to podcast API...');
            
            // Use the same API pattern as other modules but handle streaming
            const response = await fetch('http://127.0.0.1:8051/podcast/podcast/generate/stream', {
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

            statusElement.textContent = '🎧 Streaming podcast...';

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                    statusElement.textContent = '✅ Podcast generated successfully!';
                    break;
                }

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            await this.handlePodcastSegment(data);
                        } catch (parseError) {
                            console.error('Failed to parse streaming data:', parseError);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Streaming error:', error);
            
            // Provide specific guidance for common errors
            let errorMessage = '❌ Error generating podcast';
            let userGuidance = '';
            
            if (error.message && error.message.includes('Failed to fetch')) {
                // This is likely ERR_BLOCKED_BY_CLIENT
                errorMessage = '🚫 Request blocked by browser';
                userGuidance = 'This error is typically caused by browser extensions. Please:\n' +
                             '1. Disable ad blockers/privacy extensions temporarily\n' +
                             '2. Check if uBlock Origin, AdBlock, or similar extensions are active\n' +
                             '3. Add 127.0.0.1:8051 to your extension\'s whitelist\n' +
                             '4. Try opening in an incognito window with extensions disabled';
                
                console.warn('ERR_BLOCKED_BY_CLIENT detected. Common causes:');
                console.warn('- Ad blockers (uBlock Origin, AdBlock, etc.)');
                console.warn('- Privacy extensions (Privacy Badger, Ghostery, etc.)');
                console.warn('- Security extensions blocking localhost requests');
                console.warn('Solution: Temporarily disable these extensions or whitelist 127.0.0.1:8051');
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
            
            // Re-throw to be handled by caller
            throw error;
        }
    }

    // Handle individual podcast segments (text or audio)
    async handlePodcastSegment(segment) {
        if (!segment || !segment.type) return;

        this.currentSegments.push(segment);

        switch (segment.type) {
            case 'text':
                this.handleTextSegment(segment);
                break;
            case 'audio':
                await this.handleAudioSegment(segment);
                break;
            default:
                console.warn('Unknown segment type:', segment.type);
        }
    }

    // Handle text segments
    handleTextSegment(segment) {
        if (!this.textContainer || !segment.content) return;

        // Append text content to the display
        this.textContainer.textContent += segment.content;
        
        // Auto-scroll to bottom
        this.textContainer.scrollTop = this.textContainer.scrollHeight;
    }

    // Handle audio segments
    async handleAudioSegment(segment) {
        if (!segment.content || !this.currentAudioContext) return;

        try {
            // Decode base64 audio content
            const audioData = this.base64ToArrayBuffer(segment.content);
            
            // Decode audio data
            const audioBuffer = await this.currentAudioContext.decodeAudioData(audioData);
            
            // Add to audio queue
            this.audioQueue.push({
                buffer: audioBuffer,
                segmentId: segment.segment_id,
                timestamp: segment.timestamp
            });

            // Start playing if not already playing
            if (!this.isPlaying) {
                this.playNextAudio();
            }
        } catch (error) {
            console.error('Failed to handle audio segment:', error);
        }
    }

    // Convert base64 to ArrayBuffer
    base64ToArrayBuffer(base64) {
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes.buffer;
    }

    // Play next audio in queue
    async playNextAudio() {
        if (this.audioQueue.length === 0) {
            this.isPlaying = false;
            this.updateControls();
            return;
        }

        this.isPlaying = true;
        this.updateControls();

        const audioItem = this.audioQueue.shift();
        
        try {
            const source = this.currentAudioContext.createBufferSource();
            source.buffer = audioItem.buffer;
            source.connect(this.currentAudioContext.destination);
            
            source.onended = () => {
                // Play next audio after current one ends
                this.playNextAudio();
            };
            
            source.start();
        } catch (error) {
            console.error('Failed to play audio:', error);
            // Continue with next audio
            this.playNextAudio();
        }
    }

    // Toggle play/pause
    async togglePlayPause() {
        // If podcast hasn't been generated yet, start generation
        if (!this.isGenerating && this.currentSegments.length === 0) {
            const statusElement = document.getElementById('podcast-status-text');
            if (statusElement) {
                statusElement.textContent = '🔐 Checking authentication...';
            }
            
            // Check authentication before starting
            const authData = await this.getSessionToken();
            if (!authData || !authData.sessionToken) {
                const statusElement = document.getElementById('podcast-status-text');
                if (statusElement) {
                    statusElement.textContent = '❌ Please log in first by clicking the extension icon';
                }
                this.onShowMessage?.('Authentication required. Please log in first.', 'error');
                return;
            }
            
            // Start podcast generation
            await this.startPodcastGeneration();
            return;
        }
        
        // Handle audio playback pause/resume
        if (this.currentAudioContext.state === 'suspended') {
            this.currentAudioContext.resume();
        } else if (this.currentAudioContext.state === 'running') {
            this.currentAudioContext.suspend();
        }
        this.updateControls();
    }

    // Stop podcast playback
    stopPodcast() {
        this.audioQueue = [];
        this.isPlaying = false;
        
        if (this.currentAudioContext && this.currentAudioContext.state === 'running') {
            this.currentAudioContext.suspend();
        }
        
        this.updateControls();
    }

    // Update control button states
    updateControls() {
        const playPauseBtn = document.getElementById('podcast-play-pause');
        
        if (playPauseBtn) {
            if (this.isGenerating) {
                playPauseBtn.disabled = true;
                playPauseBtn.textContent = '⏸️ Generating...';
            } else if (this.currentAudioContext?.state === 'suspended' || !this.isPlaying) {
                playPauseBtn.disabled = false;
                playPauseBtn.textContent = '▶️ Play';
            } else {
                playPauseBtn.disabled = false;
                playPauseBtn.textContent = '⏸️ Pause';
            }
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

    // Clear current podcast
    clearPodcast() {
        this.stopPodcast();
        this.currentSegments = [];
        
        if (this.textContainer) {
            this.textContainer.textContent = '';
        }
        
        const statusElement = document.getElementById('podcast-status-text');
        if (statusElement) {
            statusElement.textContent = 'Ready to generate podcast';
        }
    }

    // Get current podcast state
    getPodcastState() {
        return {
            isGenerating: this.isGenerating,
            isPlaying: this.isPlaying,
            segmentCount: this.currentSegments.length,
            audioQueueLength: this.audioQueue.length
        };
    }
};
