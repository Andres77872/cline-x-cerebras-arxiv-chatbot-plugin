// Content script for the Chrome extension
console.log('Cline content script loaded on:', window.location.href);

// Create and inject floating chatbot button
function createFloatingChatButton() {
    // Check if button already exists
    if (document.getElementById('arxiv-chatbot-float-btn')) {
        return;
    }

    const floatButton = document.createElement('div');
    floatButton.id = 'arxiv-chatbot-float-btn';
    floatButton.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
      <circle cx="7" cy="9" r="1" fill="currentColor"/>
      <circle cx="12" cy="9" r="1" fill="currentColor"/>
      <circle cx="17" cy="9" r="1" fill="currentColor"/>
    </svg>
  `;

    // Style the floating button
    Object.assign(floatButton.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        backgroundColor: '#4f46e5',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        transition: 'all 0.3s ease',
        zIndex: '10000',
        fontFamily: 'system-ui, -apple-system, sans-serif'
    });

    // Add hover effects
    floatButton.addEventListener('mouseenter', () => {
        floatButton.style.transform = 'scale(1.1)';
        floatButton.style.backgroundColor = '#3730a3';
    });

    floatButton.addEventListener('mouseleave', () => {
        floatButton.style.transform = 'scale(1)';
        floatButton.style.backgroundColor = '#4f46e5';
    });

    // Add click handler
    floatButton.addEventListener('click', openChatbot);

    // Add tooltip
    floatButton.title = 'Open ArXiv Chatbot';

    // Inject into page
    document.body.appendChild(floatButton);
}

// Function to open embedded chatbot
async function openChatbot() {
    try {
        console.log('Opening embedded chatbot from floating button');

        // Check if user is logged in first
        const result = await chrome.storage.local.get(['sessionToken', 'username']);

        if (!result.sessionToken || !result.username) {
            // Show login message or redirect to popup
            showFloatingMessage('Please log in first by clicking the extension icon', false);
            return;
        }

        // Check if chatbot is already open
        if (document.getElementById('arxiv-chatbot-embed')) {
            // If chatbot is already open, close it
            closeChatbot();
            return;
        }

        // Create embedded chatbot
        createEmbeddedChatbot();
        showFloatingMessage('Chatbot opened!');
    } catch (error) {
        console.error('Error opening chatbot:', error);
        showFloatingMessage('Error opening chatbot', false);
    }
}

// Function to create embedded chatbot
function createEmbeddedChatbot() {
    // Get paper info for the chatbot
    const paperInfo = getPaperInfo();

    // Create chatbot container
    const chatbotEmbed = document.createElement('div');
    chatbotEmbed.id = 'arxiv-chatbot-embed';

    // Style the embedded chatbot
    Object.assign(chatbotEmbed.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        width: '400px',
        height: '500px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        zIndex: '10001',
        fontFamily: 'Arial, sans-serif',
        padding: '15px',
        display: 'flex',
        flexDirection: 'column'
    });

    // Create chatbot HTML content
    chatbotEmbed.innerHTML = `
    <div class="chatbot-container" style="display: flex; flex-direction: column; height: 100%;">
      <div class="chat-header" style="background-color: #007bff; color: white; padding: 10px; border-radius: 5px; margin-bottom: 15px; text-align: center; position: relative;">
        <h2 style="margin: 0; font-size: 16px;">Arxiv Paper Chatbot</h2>
        <button id="close-chatbot-btn" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: white; cursor: pointer; font-size: 18px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
          ×
        </button>
      </div>
      
      <div class="paper-info" style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 10px; margin-bottom: 15px; font-size: 12px;">
        <h3 style="margin: 0 0 5px 0; font-size: 14px;">${paperInfo.title || 'Paper Title'}</h3>
        <p style="margin: 2px 0; color: #666;">Authors: ${paperInfo.authors || 'Loading...'}</p>
        <p style="margin: 2px 0; color: #666; font-size: 11px; line-height: 1.3;">${paperInfo.abstract ? paperInfo.abstract.substring(0, 150) + '...' : 'Abstract loading...'}</p>
      </div>
      
      <div class="chat-messages" id="chat-messages" style="flex: 1; overflow-y: auto; background-color: white; border: 1px solid #ddd; border-radius: 5px; padding: 10px; margin-bottom: 15px; min-height: 250px;">
        <div class="message bot-message" style="margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #e9ecef; color: #333; margin-right: 20%; font-size: 13px;">
          Hello! I'm your Arxiv paper assistant. How can I help you understand this paper?
        </div>
      </div>
      
      <div class="chat-input" style="display: flex; gap: 10px;">
        <input type="text" id="messageInput" placeholder="Ask about the paper..." style="flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px; font-size: 12px;">
        <button id="sendButton" style="background-color: #007bff; color: white; border: none; padding: 8px 12px; border-radius: 5px; cursor: pointer; font-size: 12px;">Send</button>
      </div>
    </div>
  `;

    // Add to page
    document.body.appendChild(chatbotEmbed);

    // Add event listeners
    setupChatbotEventListeners();
}

// Function to close embedded chatbot
function closeChatbot() {
    const chatbotEmbed = document.getElementById('arxiv-chatbot-embed');
    if (chatbotEmbed) {
        chatbotEmbed.remove();
        showFloatingMessage('Chatbot closed');
    }
}

// Function to setup chatbot event listeners
function setupChatbotEventListeners() {
    const closeBtn = document.getElementById('close-chatbot-btn');
    const sendBtn = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', closeChatbot);
    }

    // Send button
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }

    // Enter key in input
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
}

// Function to send message in chatbot
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const chatMessages = document.getElementById('chat-messages');

    if (!messageInput || !chatMessages) return;

    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message to chat
    const userMessageDiv = document.createElement('div');
    userMessageDiv.className = 'message user-message';
    userMessageDiv.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #007bff; color: white; margin-left: 20%; font-size: 13px;';
    userMessageDiv.textContent = message;
    chatMessages.appendChild(userMessageDiv);

    // Clear input
    messageInput.value = '';

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;

    // Add typing indicator
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message typing';
    typingDiv.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #e9ecef; color: #333; margin-right: 20%; font-size: 13px;';
    typingDiv.textContent = 'Thinking...';
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // Get paper info for context
        const paperInfo = getPaperInfo();
        const arxivUrl = paperInfo.url || window.location.href;
        
        // Build messages array (you might want to maintain conversation history)
        const messages = [{ role: 'user', content: message }];
        
        // Use Chrome extension messaging to call centralized LLM API
        chrome.runtime.sendMessage({
            action: 'fetchChatCompletion',
            model: 'local-model',
            messages: messages,
            arxivPaperUrl: arxivUrl,
            stream: true
        }, (response) => {
            // Remove typing indicator
            if (typingDiv.parentNode) {
                typingDiv.remove();
            }
            
            if (chrome.runtime.lastError) {
                console.error('Chrome runtime error:', chrome.runtime.lastError);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'message bot-message';
                errorDiv.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #f8d7da; color: #721c24; margin-right: 20%; font-size: 13px;';
                errorDiv.textContent = 'Connection error. Please check if the API server is running.';
                chatMessages.appendChild(errorDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                return;
            }
            
            if (response && response.error) {
                console.error('API error:', response.error);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'message bot-message';
                errorDiv.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #f8d7da; color: #721c24; margin-right: 20%; font-size: 13px;';
                errorDiv.textContent = response.error;
                chatMessages.appendChild(errorDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                return;
            }
            
            if (response && response.success) {
                const botMessageDiv = document.createElement('div');
                botMessageDiv.className = 'message bot-message';
                botMessageDiv.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #e9ecef; color: #333; margin-right: 20%; font-size: 13px;';
                botMessageDiv.textContent = response.data || 'No response received from the API.';
                chatMessages.appendChild(botMessageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } else {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'message bot-message';
                errorDiv.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #f8d7da; color: #721c24; margin-right: 20%; font-size: 13px;';
                errorDiv.textContent = 'Invalid response format from API.';
                chatMessages.appendChild(errorDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        });
        
    } catch (error) {
        console.error('Error sending message:', error);
        
        // Remove typing indicator
        if (typingDiv.parentNode) {
            typingDiv.remove();
        }
        
        // Show error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'message bot-message';
        errorDiv.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #f8d7da; color: #721c24; margin-right: 20%; font-size: 13px;';
        
        let errorMessage = 'Error: ' + error.message;
        if (error.message.includes('Failed to fetch')) {
            errorMessage = 'Cannot connect to API server. Please check if the server is running.';
        }
        
        errorDiv.textContent = errorMessage;
        chatMessages.appendChild(errorDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Function to show floating messages
function showFloatingMessage(message, isSuccess = true) {
    // Remove existing message if any
    const existingMessage = document.getElementById('arxiv-chatbot-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.id = 'arxiv-chatbot-message';
    messageDiv.textContent = message;

    Object.assign(messageDiv.style, {
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        padding: '12px 16px',
        borderRadius: '8px',
        backgroundColor: isSuccess ? '#10b981' : '#ef4444',
        color: 'white',
        fontSize: '14px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        zIndex: '10001',
        opacity: '0',
        transition: 'opacity 0.3s ease'
    });

    document.body.appendChild(messageDiv);

    // Fade in
    setTimeout(() => {
        messageDiv.style.opacity = '1';
    }, 10);

    // Fade out and remove after 3 seconds
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
}

// Initialize floating button when page loads
// For PDF pages, we need a more robust approach since DOMContentLoaded may not work reliably
function initializeFloatingButton() {
    // Check if we're on an ArXiv page
    if (window.location.hostname === 'arxiv.org') {
        console.log('ArXiv page detected, initializing floating button');
        createFloatingChatButton();
    }
}

// Try multiple initialization approaches for better PDF support
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeFloatingButton);
} else {
    initializeFloatingButton();
}

// Additional fallback for PDF pages - try again after a short delay
setTimeout(() => {
    if (!document.getElementById('arxiv-chatbot-float-btn') && window.location.hostname === 'arxiv.org') {
        console.log('Fallback initialization for ArXiv page');
        initializeFloatingButton();
    }
}, 1000);

// Listen for page changes (for single-page apps)
if (typeof window.navigation !== 'undefined') {
    window.navigation.addEventListener('navigate', initializeFloatingButton);
}

// Example function to make authenticated API calls to the backend
async function makeAuthenticatedRequestToBackend(endpoint, options = {}) {
    try {
        // Send message to background script to get session token and make request
        const response = await chrome.runtime.sendMessage({
            action: 'authenticatedRequest',
            endpoint: endpoint,
            options: options
        });
        return response;
    } catch (error) {
        console.error('Authenticated request failed:', error);
        throw error;
    }
}

// Example function to logout
async function logout() {
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'logout'
        });
        return response;
    } catch (error) {
        console.error('Logout failed:', error);
        throw error;
    }
}

// Function to extract paper information from the current page
function getPaperInfo() {
    if (window.location.hostname === 'arxiv.org') {
        // Handle abstract pages (/abs/)
        if (window.location.pathname.startsWith('/abs/')) {
            const titleElement = document.querySelector('h1.title');
            const authorsElement = document.querySelector('.authors');
            const abstractElement = document.querySelector('.abstract');

            return {
                title: titleElement ? titleElement.textContent.trim() : 'Unknown Title',
                authors: authorsElement ? authorsElement.textContent.trim() : 'Unknown Authors',
                abstract: abstractElement ? abstractElement.textContent.trim() : 'No abstract available',
                url: window.location.href
            };
        }

        // Handle PDF pages (/pdf/)
        if (window.location.pathname.startsWith('/pdf/')) {
            // Extract paper ID from URL (e.g., /pdf/2301.12345.pdf -> 2301.12345)
            const paperId = window.location.pathname.match(/\/pdf\/(\d+\.\d+)/)?.[1];

            return {
                title: `ArXiv Paper ${paperId || 'PDF'}`,
                authors: 'Available in abstract page',
                abstract: `PDF view of ArXiv paper ${paperId || ''}. Visit the abstract page for full details.`,
                url: window.location.href,
                paperId: paperId,
                isPdfPage: true
            };
        }

        // Handle other ArXiv pages
        return {
            title: 'ArXiv Page',
            authors: 'N/A',
            abstract: 'ArXiv page detected',
            url: window.location.href
        };
    }

    return {
        title: 'Unknown Page',
        authors: 'N/A',
        abstract: 'Not an ArXiv page',
        url: window.location.href
    };
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getPaperInfo') {
        const paperInfo = getPaperInfo();
        sendResponse({paperInfo: paperInfo});
        return true;
    }
});

// Page-specific functionality is now handled by the universal floating button above
