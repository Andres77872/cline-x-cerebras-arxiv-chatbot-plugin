// Embedded Chatbot Module
// Handles the creation and management of the embedded chatbot UI

window.ArxivChatbot = window.ArxivChatbot || {};
window.ArxivChatbot.EmbeddedChatbot = class {
    constructor() {
        this.chatbotId = 'arxiv-chatbot-embed';
        this.onClose = null;
        this.onNewChat = null;
        this.onSendMessage = null;
        this.clickOutsideHandler = null;
    }

    // Function to create embedded chatbot
    create(paperInfo, callbacks = {}) {
        this.onClose = callbacks.onClose;
        this.onNewChat = callbacks.onNewChat;
        this.onSendMessage = callbacks.onSendMessage;

        // Check if chatbot is already open
        if (document.getElementById(this.chatbotId)) {
            return false; // Already exists
        }

        // Create chatbot container
        const chatbotEmbed = document.createElement('div');
        chatbotEmbed.id = this.chatbotId;

        // Calculate responsive positioning
        const positioning = this.calculateResponsivePositioning();
        
        // Style the embedded chatbot
        Object.assign(chatbotEmbed.style, positioning.styles);

        // Create chatbot HTML content
        chatbotEmbed.innerHTML = this.createChatbotHTML(paperInfo);

        // Add to page
        document.body.appendChild(chatbotEmbed);

        // Setup event listeners
        this.setupEventListeners();
        
        // Add click-outside-to-close functionality
        this.setupClickOutsideHandler(chatbotEmbed);

        return true; // Successfully created
    }

    // Calculate responsive positioning and sizing
    calculateResponsivePositioning() {
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

        return {
            styles: {
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
            }
        };
    }

    // Create the HTML content for the chatbot
    createChatbotHTML(paperInfo) {
        return `
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
    }

    // Setup event listeners for chatbot controls
    setupEventListeners() {
        const sendButton = document.getElementById('sendButton');
        const messageInput = document.getElementById('messageInput');
        const closeButton = document.getElementById('close-chatbot-btn');
        const newChatButton = document.getElementById('newChatButton');

        if (sendButton && this.onSendMessage) {
            sendButton.addEventListener('click', this.onSendMessage);
        }

        if (messageInput && this.onSendMessage) {
            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.onSendMessage();
                }
            });
        }

        if (closeButton && this.onClose) {
            closeButton.addEventListener('click', this.onClose);
        }

        if (newChatButton && this.onNewChat) {
            newChatButton.addEventListener('click', this.onNewChat);
        }
    }

    // Setup click outside handler
    setupClickOutsideHandler(chatbotEmbed) {
        setTimeout(() => {
            this.clickOutsideHandler = (event) => {
                // Check if click is outside chatbot and not on the float button or menu
                if (!chatbotEmbed.contains(event.target) && 
                    !document.getElementById('arxiv-chatbot-float-btn')?.contains(event.target) &&
                    !document.getElementById('arxiv-chatbot-menu')?.contains(event.target)) {
                    if (this.onClose) {
                        this.onClose();
                    }
                }
            };
            document.addEventListener('click', this.clickOutsideHandler);
            
            // Store the handler so we can remove it when chatbot is closed
            chatbotEmbed.clickOutsideHandler = this.clickOutsideHandler;
        }, 100);
    }

    // Function to close embedded chatbot
    close() {
        const chatbotEmbed = document.getElementById(this.chatbotId);
        if (chatbotEmbed) {
            // Clean up click outside handler if it exists
            if (this.clickOutsideHandler) {
                document.removeEventListener('click', this.clickOutsideHandler);
                this.clickOutsideHandler = null;
            }
            chatbotEmbed.remove();
            return true;
        }
        return false;
    }

    // Check if chatbot exists
    exists() {
        return document.getElementById(this.chatbotId) !== null;
    }

    // Update chat ID display
    updateChatIdDisplay(chatId) {
        const chatIdDisplay = document.getElementById('chatIdDisplay');
        const chatIdValue = document.getElementById('chatIdValue');
        
        if (chatIdDisplay && chatIdValue) {
            if (chatId) {
                chatIdDisplay.style.display = 'inline-block';
                chatIdValue.textContent = chatId;
            } else {
                chatIdDisplay.style.display = 'none';
            }
        }
    }

    // Get the chat messages container
    getChatMessagesContainer() {
        return document.getElementById('chat-messages');
    }

    // Get the message input
    getMessageInput() {
        return document.getElementById('messageInput');
    }

    // Clear the message input
    clearMessageInput() {
        const input = this.getMessageInput();
        if (input) {
            input.value = '';
        }
    }
}
