import { fetchChatCompletion } from '../api/llm.js';

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

            // Always attempt API call - use paper URL if available, otherwise use a default
            const arxivUrl = paperInfo ? paperInfo.url : window.location.href;
            
            fetchChatCompletion(
                'local-model',
                messages,
                arxivUrl,
                (chunk) => {
                    console.log('Received chunk:', chunk);
                    
                    // Remove loading indicator on first chunk
                    if (loadingElement.parentNode) {
                        loadingElement.remove();
                    }
                    
                    if (chunk.choices && chunk.choices[0] && chunk.choices[0].delta) {
                        const content = chunk.choices[0].delta.content || '';
                        currentResponse += content;
                        
                        if (!botMessageElement) {
                            botMessageElement = document.createElement('div');
                            botMessageElement.className = 'message bot-message';
                            chatMessages.appendChild(botMessageElement);
                        }
                        
                        botMessageElement.textContent = currentResponse;
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                }
            ).then(() => {
                // Remove loading indicator if still present
                if (loadingElement.parentNode) {
                    loadingElement.remove();
                }
                
                if (currentResponse) {
                    messages.push({ role: 'assistant', content: currentResponse });
                    console.log('Complete response received:', currentResponse);
                } else {
                    // If no streaming response, show fallback message
                    if (!botMessageElement) {
                        addMessage('No response received from the API server.');
                    }
                }
                currentResponse = '';
                botMessageElement = null;
            }).catch(error => {
                console.error('API Error:', error);
                
                // Remove loading indicator
                if (loadingElement.parentNode) {
                    loadingElement.remove();
                }
                
                // Show detailed error message
                let errorMessage = 'Connection failed. ';
                if (error.message.includes('Failed to fetch')) {
                    errorMessage += 'Please ensure the API server is running at http://127.0.0.1:8051';
                } else {
                    errorMessage += `Error: ${error.message}`;
                }
                
                addMessage(errorMessage);
                currentResponse = '';
                botMessageElement = null;
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
