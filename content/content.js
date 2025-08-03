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

    // Initialize the floating button
    initializeFloatingButton() {
        try {
            // Check if we're on a supported page
            const currentUrl = window.location.href;
            
            // Only show on specific sites or all URLs based on manifest
            if (currentUrl) {
                this.floatingButton.create(this.toggleMenu.bind(this));
                console.log('Floating button initialized');
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
                this.utilities.showFloatingMessage('Resume feature coming soon!', false);
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

    // Setup podcast interface for current arXiv paper
    async generatePodcast() {
        try {
            console.log('Setting up podcast interface from floating button');

            // Get current paper info
            const paperInfo = this.paperInfo.getPaperInfo();
            if (!paperInfo || !paperInfo.url) {
                this.utilities.showFloatingMessage('Please navigate to an arXiv paper page first', false);
                return false;
            }

            // Check if chatbot is already open, if not create it for podcast display
            let podcastContainer;
            if (!this.embeddedChatbot.exists()) {
                // Create chatbot interface for podcast display
                const chatbotCallbacks = {
                    onNewChat: () => this.startNewChat(),
                    onSendMessage: () => this.sendMessage(),
                    onClose: () => this.closeChatbot()
                };

                const success = this.embeddedChatbot.create(paperInfo, chatbotCallbacks);
                if (!success) {
                    this.utilities.showFloatingMessage('Failed to create podcast interface', false);
                    return false;
                }
            }

            // Get the podcast container (use chat messages area)
            podcastContainer = document.getElementById('chat-messages');
            if (!podcastContainer) {
                this.utilities.showFloatingMessage('Failed to find podcast container', false);
                return false;
            }

            // Setup podcast UI only (don't start streaming yet)
            this.utilities.showFloatingMessage('Podcast interface ready');
            
            // Setup podcast UI with the current paper URL
            await this.podcast.setupPodcastInterface(paperInfo.url, podcastContainer);
            
            return true;

        } catch (error) {
            console.error('Error setting up podcast:', error);
            this.utilities.showFloatingMessage('Error setting up podcast', false);
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
