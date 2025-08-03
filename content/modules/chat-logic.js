// Chat Logic Module
// Handles message sending, conversation management, and chat interactions

window.ArxivChatbot = window.ArxivChatbot || {};
window.ArxivChatbot.ChatLogic = class {
    constructor() {
        this.chatMessages = [];
        this.currentChatId = null;
        this.botMessageElement = null;
        this.onShowMessage = null;
        this.apiClient = null;
    }

    // Initialize with dependencies
    initialize(apiClient, onShowMessage) {
        this.apiClient = apiClient;
        this.onShowMessage = onShowMessage;
    }

    // Function to update chat ID display
    updateChatIdDisplay(chatId) {
        this.currentChatId = chatId;
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

    // Function to add a message to the chat
    addMessage(text, isUser = false) {
        const chatMessages = document.getElementById('chat-messages');
        if (!chatMessages) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        
        const baseStyles = 'margin: 8px 0; padding: 12px 16px; font-size: 13px; line-height: 1.4; box-shadow: 0 1px 3px rgba(0,0,0,0.1);';
        
        if (isUser) {
            messageDiv.style.cssText = baseStyles + 'border-radius: 18px 18px 4px 18px; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; margin-left: 20%; text-align: right;';
        } else {
            messageDiv.style.cssText = baseStyles + 'border-radius: 18px 18px 18px 4px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); color: #334155; margin-right: 20%; border: 1px solid #e2e8f0;';
        }
        
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return messageDiv;
    }

    // Function to handle new chat
    startNewChat() {
        try {
            // Clear existing messages
            const chatMessages = document.getElementById('chat-messages');
            if (chatMessages) {
                chatMessages.innerHTML = `
                    <div class="message bot-message" style="margin: 8px 0; padding: 12px 16px; border-radius: 18px 18px 18px 4px; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); color: #334155; margin-right: 20%; font-size: 13px; line-height: 1.4; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border: 1px solid #e2e8f0;">
                      👋 Hello! I'm your ArXiv paper assistant. How can I help you understand this paper?
                    </div>
                `;
            }

            // Reset chat state
            this.chatMessages = [];
            this.currentChatId = null;
            this.botMessageElement = null;
            
            // Update chat ID display
            this.updateChatIdDisplay(null);
            
            if (this.onShowMessage) {
                this.onShowMessage('New chat started!');
            }
        } catch (error) {
            console.error('Error starting new chat:', error);
            if (this.onShowMessage) {
                this.onShowMessage('Error starting new chat', false);
            }
        }
    }

    // Function to send message in chatbot using streaming
    async sendMessage() {
        try {
            const messageInput = document.getElementById('messageInput');
            const sendButton = document.getElementById('sendButton');
            
            if (!messageInput || !sendButton) {
                console.error('Message input or send button not found');
                return;
            }

            const message = messageInput.value.trim();
            if (!message) {
                console.log('Empty message, not sending');
                return;
            }

            console.log('Sending message:', message);

            // Add user message to chat
            this.addMessage(message, true);
            this.chatMessages.push({ role: 'user', content: message });

            // Clear input and disable send button
            messageInput.value = '';
            sendButton.disabled = true;
            sendButton.textContent = 'Sending...';

            // Add bot message placeholder with loading animation
            this.botMessageElement = this.addMessage('💭 Thinking...', false);

            // Get paper info for context
            const paperInfo = this.getPaperInfoForContext();

            // Prepare the conversation context
            const conversationContext = this.chatMessages.map(msg => ({
                role: msg.role,
                content: msg.content
            }));

            // Use port-based streaming instead of regular API client
            await this.sendStreamingMessage(conversationContext, paperInfo);

        } catch (error) {
            console.error('Error sending message:', error);
            
            // Update bot message with error
            if (this.botMessageElement) {
                this.botMessageElement.textContent = 'Sorry, I encountered an error. Please try again.';
            }
            
            if (this.onShowMessage) {
                this.onShowMessage('Error sending message', false);
            }
        } finally {
            // Re-enable send button
            const sendButton = document.getElementById('sendButton');
            if (sendButton) {
                sendButton.disabled = false;
                sendButton.textContent = 'Send';
            }
        }
    }

    // New method for handling streaming messages
    async sendStreamingMessage(messages, paperInfo) {
        return new Promise((resolve, reject) => {
            // Connect to background script for streaming
            const port = chrome.runtime.connect({ name: 'chatbot-stream' });
            let botResponse = '';
            
            // Handle incoming messages from background script
            port.onMessage.addListener((message) => {
                console.log('Received streaming message:', message);
                
                if (message.type === 'chunk') {
                    // Append content to bot response
                    botResponse += message.content;
                    
                    // Update bot message element with streaming content
                    if (this.botMessageElement) {
                        this.botMessageElement.textContent = botResponse;
                    }
                } else if (message.type === 'chat_id') {
                    // Update chat ID
                    if (message.chat_id && message.chat_id !== this.currentChatId) {
                        this.currentChatId = message.chat_id;
                        this.updateChatIdDisplay(this.currentChatId);
                    }
                } else if (message.type === 'error') {
                    console.error('Streaming error:', message.error);
                    if (this.botMessageElement) {
                        this.botMessageElement.textContent = 'Sorry, I encountered an error processing your request.';
                    }
                    reject(new Error(message.error));
                } else if (message.type === 'complete') {
                    console.log('Streaming completed');
                    // Add final response to chat messages
                    if (botResponse.trim()) {
                        this.chatMessages.push({ role: 'assistant', content: botResponse });
                    }
                    resolve(botResponse);
                }
            });
            
            // Handle port disconnection
            port.onDisconnect.addListener(() => {
                console.log('Streaming port disconnected');
                if (botResponse.trim()) {
                    // If we got some response before disconnection, save it
                    this.chatMessages.push({ role: 'assistant', content: botResponse });
                    resolve(botResponse);
                } else {
                    resolve('');
                }
            });
            
            // Send the message to background script for streaming processing
            port.postMessage({
                action: 'fetchChatCompletion',
                model: 'local-model',
                messages: messages,
                arxivPaperUrl: paperInfo?.url || window.location.href
            });
        });
    }

    // Get paper info for context (this method should be provided by the paper info module)
    getPaperInfoForContext() {
        // This will be injected by the main content script
        if (window.paperInfoExtractor) {
            return window.paperInfoExtractor.getPaperInfo();
        }
        
        // Fallback to basic extraction
        return {
            title: document.title || 'Unknown Paper',
            url: window.location.href,
            authors: 'Unknown',
            abstract: 'Abstract not available'
        };
    }

    // Get current chat state
    getChatState() {
        return {
            messages: this.chatMessages,
            chatId: this.currentChatId
        };
    }

    // Set chat state (for restoring conversations)
    setChatState(state) {
        this.chatMessages = state.messages || [];
        this.currentChatId = state.chatId || null;
        this.updateChatIdDisplay(this.currentChatId);
    }

    // Clear chat state
    clearChatState() {
        this.chatMessages = [];
        this.currentChatId = null;
        this.botMessageElement = null;
        this.updateChatIdDisplay(null);
    }
}
