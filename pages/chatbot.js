document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.querySelector('.chat-messages');
    let messages = [];
    let currentResponse = '';
    let botMessageElement = null;
    let paperInfo = null;

    // Function to add a message to the chat
    function addMessage(text, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
        messageDiv.textContent = text;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Handle send button click
    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            addMessage(message, true);
            messages.push({ role: 'user', content: message });
            messageInput.value = '';
            
            // Add loading indicator
            const loadingElement = document.createElement('div');
            loadingElement.className = 'message bot-message';
            loadingElement.textContent = 'Thinking...';
            chatMessages.appendChild(loadingElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // Use centralized LLM handler from background script
            const arxivUrl = paperInfo ? paperInfo.url : window.location.href;
            
            // Remove loading indicator immediately
            if (loadingElement.parentNode) {
                loadingElement.remove();
            }
            
            // Create bot message element for real-time updates
            if (!botMessageElement) {
                botMessageElement = document.createElement('div');
                botMessageElement.className = 'message bot-message';
                botMessageElement.textContent = '';
                chatMessages.appendChild(botMessageElement);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            // Use background script's centralized LLM handler
            console.log('Chatbot: Sending request with messages:', messages);
            console.log('Chatbot: ArXiv URL:', arxivUrl);
            
            chrome.runtime.sendMessage({
                action: 'fetchChatCompletion',
                model: 'local-model',
                messages: messages,
                arxivPaperUrl: arxivUrl
            }, (response) => {
                console.log('Chatbot: Received response:', response);
                if (response && response.success) {
                    // Update bot message with complete response
                    const content = response.data;
                    botMessageElement.textContent = content;
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                    
                    // Add the complete message to messages array
                    messages.push({ role: 'assistant', content: content });
                    
                    // Reset for next message
                    currentResponse = '';
                    botMessageElement = null;
                } else {
                    console.error('LLM API Error:', response ? response.error : 'Unknown error');
                    
                    // Show error message
                    const errorMessage = `Error: ${response ? response.error : 'Unknown error'}`;
                    addMessage(errorMessage, false);
                    
                    // Reset state
                    currentResponse = '';
                    botMessageElement = null;
                }
            });
        }
    });

    // Handle Enter key in input
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    // Get paper information from the current page
    chrome.runtime.sendMessage({action: 'getPaperInfo'}, (response) => {
        if (chrome.runtime.lastError) {
            console.log('Error getting paper info:', chrome.runtime.lastError);
            return;
        }
        if (response && response.paperInfo) {
            paperInfo = response.paperInfo;
            const paperInfoDiv = document.querySelector('.paper-info');
            paperInfoDiv.innerHTML = `
                <h3>${response.paperInfo.title || 'Paper Title'}</h3>
                <p>Authors: ${response.paperInfo.authors || 'Author names here'}</p>
                <p>Abstract: ${response.paperInfo.abstract || 'Paper abstract will appear here'}</p>
            `;
        }
    });
});
