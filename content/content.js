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

    // Calculate responsive positioning above the floating button
    const floatingButton = document.getElementById('arxiv-chatbot-float-btn');
    const buttonRect = floatingButton ? floatingButton.getBoundingClientRect() : null;
    
    // Responsive sizing based on viewport
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let chatbotWidth, chatbotHeight, rightPos, bottomPos;
    
    if (viewportWidth <= 768) {
        // Mobile/tablet
        chatbotWidth = Math.min(viewportWidth - 20, 350);
        chatbotHeight = Math.min(viewportHeight - 40, 450);
        rightPos = '10px';
        bottomPos = '90px'; // Above floating button
    } else {
        // Desktop
        chatbotWidth = '380px';
        chatbotHeight = '520px';
        rightPos = '20px';
        bottomPos = '90px'; // Above floating button
    }
    
    // Style the embedded chatbot
    Object.assign(chatbotEmbed.style, {
        position: 'fixed',
        bottom: bottomPos,
        right: rightPos,
        width: chatbotWidth + (typeof chatbotWidth === 'number' ? 'px' : ''),
        height: chatbotHeight + (typeof chatbotHeight === 'number' ? 'px' : ''),
        maxWidth: 'calc(100vw - 20px)',
        maxHeight: 'calc(100vh - 40px)',
        backgroundColor: '#ffffff',
        border: '1px solid #e1e5e9',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
        zIndex: '10001',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    });

    // Create chatbot HTML content
    chatbotEmbed.innerHTML = `
    <div class="chatbot-container" style="display: flex; flex-direction: column; height: 100%;">
      <div class="chat-header" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 16px; border-radius: 12px 12px 0 0; text-align: center; position: relative; box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);">
        <h2 style="margin: 0; font-size: 16px; font-weight: 600;">ArXiv Paper Chatbot</h2>
        <div id="chatIdDisplay" style="font-size: 11px; opacity: 0.9; margin-top: 4px; display: none; background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 12px; display: inline-block;">
            Chat ID: <span id="chatIdValue"></span>
        </div>
        <button id="close-chatbot-btn" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.2); border: none; color: white; cursor: pointer; font-size: 16px; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.3)'" onmouseout="this.style.background='rgba(255,255,255,0.2)'">
          ×
        </button>
      </div>
      
      <div class="paper-info" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border: 1px solid #f59e0b; border-radius: 8px; padding: 12px; margin: 16px; font-size: 12px; box-shadow: 0 1px 4px rgba(245, 158, 11, 0.1);">
        <h3 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #92400e; line-height: 1.3;">${paperInfo.title || 'Paper Title'}</h3>
        <p style="margin: 3px 0; color: #b45309; font-size: 11px;">Authors: ${paperInfo.authors || 'Loading...'}</p>
        <p style="margin: 4px 0 0 0; color: #a16207; font-size: 10px; line-height: 1.4; opacity: 0.9;">${paperInfo.abstract ? paperInfo.abstract.substring(0, 120) + '...' : 'Abstract loading...'}</p>
      </div>
      
      <div class="chat-messages" id="chat-messages" style="flex: 1; overflow-y: auto; background-color: #fafafa; border: none; border-radius: 0; padding: 16px; margin: 0 16px; min-height: 200px; max-height: 300px; scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent;">
        <div class="message bot-message" style="margin: 8px 0; padding: 12px 16px; border-radius: 18px 18px 18px 4px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); color: #334155; margin-right: 20%; font-size: 13px; line-height: 1.4; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
          👋 Hello! I'm your ArXiv paper assistant. How can I help you understand this paper?
        </div>
      </div>
      
      <div style="margin: 12px 16px 8px 16px; text-align: center;">
        <button id="newChatButton" style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); color: white; border: none; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 11px; font-weight: 500; transition: all 0.2s; box-shadow: 0 2px 4px rgba(107, 114, 128, 0.2);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(107, 114, 128, 0.3)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(107, 114, 128, 0.2)'">
          🔄 New Chat
        </button>
      </div>
      
      <div class="chat-input" style="display: flex; gap: 8px; padding: 16px; background: #f8fafc; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
        <input type="text" id="messageInput" placeholder="Ask about the paper..." style="flex: 1; padding: 12px 16px; border: 1px solid #d1d5db; border-radius: 24px; font-size: 13px; outline: none; transition: all 0.2s; background: white;" onfocus="this.style.borderColor='#4f46e5'; this.style.boxShadow='0 0 0 3px rgba(79, 70, 229, 0.1)'" onblur="this.style.borderColor='#d1d5db'; this.style.boxShadow='none'">
        <button id="sendButton" style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; border: none; padding: 12px 18px; border-radius: 24px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s; min-width: 70px; box-shadow: 0 2px 6px rgba(79, 70, 229, 0.3);" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(79, 70, 229, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 6px rgba(79, 70, 229, 0.3)'">
          Send
        </button>
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
    const sendButton = document.getElementById('sendButton');
    const messageInput = document.getElementById('messageInput');
    const closeButton = document.getElementById('close-chatbot-btn');
    const newChatButton = document.getElementById('newChatButton');

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }

    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    if (closeButton) {
        closeButton.addEventListener('click', closeChatbot);
    }

    if (newChatButton) {
        newChatButton.addEventListener('click', startNewChat);
    }

    // Focus on input when chatbot opens
    if (messageInput) {
        messageInput.focus();
    }
}

// Global variables for conversation tracking
let chatMessages = [];
let currentChatId = null;
let botMessageElement = null;

// Function to update chat ID display in header
function updateChatIdDisplay(chatId) {
    const chatIdDisplay = document.getElementById('chatIdDisplay');
    const chatIdValue = document.getElementById('chatIdValue');
    
    if (chatId) {
        // Show first 8 characters of chat_id
        const shortChatId = chatId.substring(0, 8);
        chatIdValue.textContent = shortChatId;
        chatIdDisplay.style.display = 'block';
        currentChatId = chatId;
        console.log('Displaying chat_id in header:', shortChatId);
    } else {
        // Hide chat_id display when no chat_id
        chatIdDisplay.style.display = 'none';
        currentChatId = null;
        console.log('Hiding chat_id display');
    }
}

// Function to add a message to the chat
function addMessage(text, isUser = false) {
    const chatMessagesContainer = document.getElementById('chat-messages');
    if (!chatMessagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.style.cssText = isUser 
        ? 'margin: 8px 0; padding: 12px 16px; border-radius: 18px 18px 4px 18px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; margin-left: 20%; font-size: 13px; line-height: 1.4; box-shadow: 0 1px 3px rgba(79, 70, 229, 0.3); max-width: 280px; margin-left: auto; word-wrap: break-word;'
        : 'margin: 8px 0; padding: 12px 16px; border-radius: 18px 18px 18px 4px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); color: #334155; margin-right: 20%; font-size: 13px; line-height: 1.4; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; max-width: 280px; word-wrap: break-word;';
    messageDiv.textContent = text;
    chatMessagesContainer.appendChild(messageDiv);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
}

// Function to handle new chat
function startNewChat() {
    // Clear conversation history
    chatMessages = [];
    currentChatId = null;
    botMessageElement = null;
    
    // Clear chat display
    const chatMessagesContainer = document.getElementById('chat-messages');
    if (chatMessagesContainer) {
        chatMessagesContainer.innerHTML = `
            <div class="message bot-message" style="margin: 8px 0; padding: 12px 16px; border-radius: 18px 18px 18px 4px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); color: #334155; margin-right: 20%; font-size: 13px; line-height: 1.4; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; max-width: 280px; word-wrap: break-word;">
                👋 Hello! I'm your ArXiv paper assistant. How can I help you understand this paper?
            </div>
        `;
    }
    
    // Hide chat ID display
    updateChatIdDisplay(null);
    
    console.log('Started new chat session');
}

// Function to send message in chatbot
async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const chatMessagesContainer = document.getElementById('chat-messages');

    if (!messageInput || !chatMessagesContainer) return;

    const message = messageInput.value.trim();
    if (!message) return;

    // Add user message to conversation history
    addMessage(message, true);
    chatMessages.push({ role: 'user', content: message });
    
    // Clear input
    messageInput.value = '';

    // Add loading indicator
    const loadingElement = document.createElement('div');
    loadingElement.className = 'message bot-message';
    loadingElement.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #e9ecef; color: #333; margin-right: 20%; font-size: 13px;';
    loadingElement.textContent = 'Thinking...';
    chatMessagesContainer.appendChild(loadingElement);
    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;

    try {
        // Get paper info for context
        const paperInfo = getPaperInfo();
        const arxivUrl = paperInfo.url || window.location.href;
        
        // Remove loading indicator immediately
        if (loadingElement.parentNode) {
            loadingElement.remove();
        }
        
        // Create bot message element for real-time updates
        if (!botMessageElement) {
            botMessageElement = document.createElement('div');
            botMessageElement.className = 'message bot-message';
            botMessageElement.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #e9ecef; color: #333; margin-right: 20%; font-size: 13px;';
            botMessageElement.textContent = '';
            chatMessagesContainer.appendChild(botMessageElement);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
        
        // Use Chrome extension messaging to call centralized LLM API
        console.log('Chatbot: Sending request with messages:', chatMessages);
        console.log('Chatbot: ArXiv URL:', arxivUrl);
        
        chrome.runtime.sendMessage({
            action: 'fetchChatCompletion',
            model: 'local-model',
            messages: chatMessages,
            arxivPaperUrl: arxivUrl
        }, (response) => {
            console.log('Chatbot: Received response:', response);
            console.log('Chatbot: Response chat_id:', response?.chat_id);
            
            if (chrome.runtime.lastError) {
                console.error('Chrome runtime error:', chrome.runtime.lastError);
                if (botMessageElement) {
                    botMessageElement.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #f8d7da; color: #721c24; margin-right: 20%; font-size: 13px;';
                    botMessageElement.textContent = 'Connection error. Please check if the API server is running.';
                }
                return;
            }
            
            if (response && response.error) {
                console.error('API error:', response.error);
                if (botMessageElement) {
                    botMessageElement.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #f8d7da; color: #721c24; margin-right: 20%; font-size: 13px;';
                    botMessageElement.textContent = response.error;
                }
                return;
            }
            
            if (response && response.success) {
                // Update bot message with complete response
                const content = response.data;
                if (botMessageElement) {
                    botMessageElement.textContent = content;
                    chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
                }
                
                // Update chat_id display if present in response
                console.log('Chatbot: Checking for chat_id in response...');
                if (response.chat_id) {
                    console.log('Chatbot: Found chat_id, updating display:', response.chat_id);
                    updateChatIdDisplay(response.chat_id);
                } else {
                    console.log('Chatbot: No chat_id found in response');
                }
                
                // Add the complete message to conversation history
                chatMessages.push({ role: 'assistant', content: content });
                
                // Reset for next message
                botMessageElement = null;
            } else {
                if (botMessageElement) {
                    botMessageElement.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #f8d7da; color: #721c24; margin-right: 20%; font-size: 13px;';
                    botMessageElement.textContent = 'Invalid response format from API.';
                }
            }
        });
        
    } catch (error) {
        console.error('Error sending message:', error);
        
        // Remove loading indicator
        if (loadingElement.parentNode) {
            loadingElement.remove();
        }
        
        // Show error message
        if (botMessageElement) {
            botMessageElement.style.cssText = 'margin: 10px 0; padding: 8px; border-radius: 5px; background-color: #f8d7da; color: #721c24; margin-right: 20%; font-size: 13px;';
            
            let errorMessage = 'Error: ' + error.message;
            if (error.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to API server. Please check if the server is running.';
            }
            
            botMessageElement.textContent = errorMessage;
        }
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
