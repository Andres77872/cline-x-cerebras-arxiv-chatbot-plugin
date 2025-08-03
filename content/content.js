// Content script for the Chrome extension
// Refactored to use modular structure with namespace pattern

// All modules are loaded via manifest.json and available in window.ArxivChatbot namespace

console.log('Cline content script loaded on:', window.location.href);

// Main Content Script Class
class ArxivChatbotContentScript {
    constructor() {
        this.isInitialized = false;
        this.currentUrl = window.location.href;
        
        // Initialize modules using namespace pattern
        this.utilities = new window.ArxivChatbot.Utilities();
        this.chromeMessaging = new window.ArxivChatbot.ChromeMessaging();
        this.paperInfo = new window.ArxivChatbot.PaperInfo();
        this.floatingButton = new window.ArxivChatbot.FloatingButton();
        this.floatingMenu = new window.ArxivChatbot.FloatingMenu();
        this.embeddedChatbot = new window.ArxivChatbot.EmbeddedChatbot();
        this.chatLogic = new window.ArxivChatbot.ChatLogic();
        this.podcast = new window.ArxivChatbot.Podcast();
        this.resume = new window.ArxivChatbot.Resume();

        // Initialize API client
        this.apiClient = this.chromeMessaging.createApiClient();

        // Setup module dependencies
        this.setupModuleDependencies();

        // Setup Chrome messaging handlers
        this.setupChromeMessageHandlers();

        // Make paper info extractor globally available for modules
        window.paperInfoExtractor = this.paperInfo;
    }

    // Setup dependencies between modules
    setupModuleDependencies() {
        // Initialize chat logic with dependencies
        this.chatLogic.initialize(
            this.apiClient,
            this.utilities.showFloatingMessage.bind(this.utilities)
        );

        // Initialize podcast with dependencies
        this.podcast.initialize(
            this.apiClient,
            this.utilities.showFloatingMessage.bind(this.utilities)
        );

        // Initialize resume with dependencies
        this.resume.initialize(
            this.apiClient,
            this.utilities.showFloatingMessage.bind(this.utilities)
        );

        // Setup floating menu callback
        this.floatingMenu.onMenuAction = this.handleMenuAction.bind(this);
    }

    // Setup Chrome extension message handlers
    setupChromeMessageHandlers() {
        // Handle paper info requests from background script
        this.chromeMessaging.onMessage('getPaperInfo', () => {
            return this.paperInfo.getPaperInfo();
        });

        // Handle chatbot open requests
        this.chromeMessaging.onMessage('openChatbot', () => {
            return this.openChatbot();
        });

        // Handle chatbot close requests
        this.chromeMessaging.onMessage('closeChatbot', () => {
            return this.closeChatbot();
        });
    }

    // Check if current URL is an arXiv page
    isArxivPage(url) {
        if (!url) return false;
        
        // Match arXiv URLs like:
        // https://arxiv.org/pdf/XXXX.XXXXX
        // https://arxiv.org/abs/XXXX.XXXXX
        // http://arxiv.org/pdf/XXXX.XXXXX
        // http://arxiv.org/abs/XXXX.XXXXX
        const arxivPattern = /^https?:\/\/arxiv\.org\/(pdf|abs)\//i;
        
        return arxivPattern.test(url);
    }

    // Initialize the floating button
    initializeFloatingButton() {
        try {
            // Check if we're on an arXiv page
            const currentUrl = window.location.href;
            
            // Only show on arXiv pages
            if (this.isArxivPage(currentUrl)) {
                this.floatingButton.create(this.toggleMenu.bind(this));
                console.log('Floating button initialized on arXiv page:', currentUrl);
            } else {
                console.log('Floating button not shown - not an arXiv page:', currentUrl);
                // Remove button if it exists and we're not on an arXiv page
                if (this.floatingButton.exists()) {
                    this.floatingButton.remove();
                }
            }
        } catch (error) {
            console.error('Error initializing floating button:', error);
        }
    }

    // Toggle the floating menu
    toggleMenu() {
        this.floatingMenu.toggle();
    }

    // Handle menu actions
    handleMenuAction(action) {
        switch (action) {
            case 'chat':
                this.openChatbot();
                break;
            case 'resume':
                this.generateResume();
                break;
            case 'podcast':
                this.generatePodcast();
                break;
            default:
                console.log('Unknown action:', action);
        }
    }

    // Open the embedded chatbot
    async openChatbot() {
        try {
            console.log('Opening embedded chatbot from floating button');

            // Check if user is logged in first
            const isLoggedIn = await this.chromeMessaging.auth.isLoggedIn();

            if (!isLoggedIn) {
                this.utilities.showFloatingMessage('Please log in first by clicking the extension icon', false);
                return false;
            }

            // Check if chatbot is already open
            if (this.embeddedChatbot.exists()) {
                // If chatbot is already open, close it
                this.closeChatbot();
                return true;
            }

            // Get paper info for the chatbot
            const paperInfo = this.paperInfo.getFormattedInfo();

            // Create embedded chatbot with callbacks
            const chatbotCallbacks = {
                onClose: this.closeChatbot.bind(this),
                onNewChat: this.startNewChat.bind(this),
                onSendMessage: this.sendMessage.bind(this)
            };

            const success = this.embeddedChatbot.create(paperInfo, chatbotCallbacks);
            
            if (success) {
                this.utilities.showFloatingMessage('Chatbot opened!');
                return true;
            } else {
                this.utilities.showFloatingMessage('Chatbot is already open', false);
                return false;
            }

        } catch (error) {
            console.error('Error opening chatbot:', error);
            this.utilities.showFloatingMessage('Error opening chatbot', false);
            return false;
        }
    }

    // Create standalone podcast interface for current arXiv paper
    async generatePodcast() {
        try {
            console.log('Creating standalone podcast interface from floating button');

            // Check if user is logged in first
            const isLoggedIn = await this.chromeMessaging.auth.isLoggedIn();
            if (!isLoggedIn) {
                this.utilities.showFloatingMessage('Please log in first by clicking the extension icon', false);
                return false;
            }

            // Get current paper info
            const paperInfo = this.paperInfo.getPaperInfo();
            if (!paperInfo || !paperInfo.url) {
                this.utilities.showFloatingMessage('Please navigate to an arXiv paper page first', false);
                return false;
            }

            // Check if podcast window is already open
            if (this.podcast.isPodcastWindowOpen()) {
                this.utilities.showFloatingMessage('Podcast is already open', false);
                return false;
            }

            // Create standalone podcast interface
            const success = await this.podcast.createStandalonePodcast(paperInfo);
            
            if (success) {
                this.utilities.showFloatingMessage('Podcast interface opened!');
                return true;
            } else {
                this.utilities.showFloatingMessage('Failed to create podcast interface', false);
                return false;
            }

        } catch (error) {
            console.error('Error creating podcast:', error);
            this.utilities.showFloatingMessage('Error creating podcast interface', false);
            return false;
        }
    }

    // Generate resume for current paper
    async generateResume() {
        try {
            console.log('Creating standalone resume interface from floating button');

            // Check if user is logged in first
            const isLoggedIn = await this.chromeMessaging.auth.isLoggedIn();
            if (!isLoggedIn) {
                this.utilities.showFloatingMessage('Please log in first by clicking the extension icon', false);
                return false;
            }

            // Get current paper info
            const paperInfo = this.paperInfo.getPaperInfo();
            if (!paperInfo || !paperInfo.url) {
                this.utilities.showFloatingMessage('Please navigate to an arXiv paper page first', false);
                return false;
            }

            // Check if resume window is already open
            if (this.resume.isResumeWindowOpen()) {
                this.utilities.showFloatingMessage('Resume is already open', false);
                return false;
            }

            // Create standalone resume interface
            const success = await this.resume.createStandaloneResume(paperInfo);
            
            if (success) {
                this.utilities.showFloatingMessage('Resume interface opened!');
                return true;
            } else {
                this.utilities.showFloatingMessage('Failed to create resume interface', false);
                return false;
            }

        } catch (error) {
            console.error('Error creating resume:', error);
            this.utilities.showFloatingMessage('Error creating resume interface', false);
            return false;
        }
    }

    // Close the embedded chatbot
    closeChatbot() {
        const success = this.embeddedChatbot.close();
        if (success) {
            this.utilities.showFloatingMessage('Chatbot closed');
            // Clear chat state when closing
            this.chatLogic.clearChatState();
        }
        return success;
    }

    // Start a new chat
    startNewChat() {
        this.chatLogic.startNewChat();
    }

    // Send a message in the chat
    sendMessage() {
        this.chatLogic.sendMessage();
    }

    // Initialize the content script
    initialize() {
        // Initialize floating button when page loads
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeFloatingButton();
            });
        } else {
            // Page already loaded
            this.initializeFloatingButton();
        }

        // Also try after a short delay for PDF and dynamic pages
        setTimeout(() => {
            if (!this.floatingButton.exists()) {
                this.initializeFloatingButton();
            }
        }, 1000);

        // Try again after page seems fully loaded for complex pages
        setTimeout(() => {
            if (!this.floatingButton.exists()) {
                this.initializeFloatingButton();
            }
        }, 3000);

        console.log('ArXiv Chatbot Content Script initialized');
    }

    // Cleanup method
    destroy() {
        // Remove all UI elements
        this.floatingButton.remove();
        this.floatingMenu.remove();
        this.embeddedChatbot.close();

        // Clear cached data
        this.paperInfo.clearCache();
        this.chatLogic.clearChatState();

        console.log('ArXiv Chatbot Content Script destroyed');
    }
}

// Global instance
let arxivChatbot = null;

// Wait for all modules to be loaded before initializing
function initializeWhenReady() {
    // Check if all required modules are available
    const requiredModules = [
        'Utilities', 'ChromeMessaging', 'PaperInfo', 
        'FloatingButton', 'FloatingMenu', 'EmbeddedChatbot', 'ChatLogic'
    ];
    
    const missingModules = requiredModules.filter(moduleName => 
        !window.ArxivChatbot || !window.ArxivChatbot[moduleName]
    );
    
    if (missingModules.length > 0) {
        console.log('Waiting for modules to load:', missingModules);
        setTimeout(initializeWhenReady, 100);
        return;
    }
    
    // Initialize the extension
    try {
        window.arxivChatbotInstance = new ArxivChatbotContentScript();
        window.arxivChatbotInstance.initialize();
    } catch (error) {
        console.error('Failed to initialize ArXiv Chatbot:', error);
    }
}

// Start initialization
initializeWhenReady();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.arxivChatbotInstance) {
        window.arxivChatbotInstance.destroy();
    }
});

// Handle page navigation for single-page applications
let lastUrl = window.location.href;
const checkForUrlChange = () => {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        console.log('URL changed to:', currentUrl);
        
        // Reinitialize on URL change
        if (arxivChatbot) {
            arxivChatbot.paperInfo.clearCache(); // Clear cached paper info
            
            // Reinitialize floating button if it doesn't exist
            if (!arxivChatbot.floatingButton.exists()) {
                setTimeout(() => {
                    arxivChatbot.initializeFloatingButton();
                }, 500);
            }
        }
    }
};

// Monitor for URL changes (for SPAs)
setInterval(checkForUrlChange, 1000);

// Export for testing or external access
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ArxivChatbotContentScript;
}
