// Chatbot functionality for the Chrome extension
document.addEventListener('DOMContentLoaded', () => {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatMessages = document.querySelector('.chat-messages');

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
            messageInput.value = '';

            // Simulate bot response
            setTimeout(() => {
                addMessage("I'm analyzing the paper content. In a real implementation, this would connect to an AI service to provide intelligent responses about the paper.");
            }, 1000);
        }
    });

    // Handle Enter key in input
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendButton.click();
        }
    });

    // Example of how to get paper information from the current page
    // This would typically be populated by the content script
    try {
        chrome.runtime.sendMessage({action: 'getPaperInfo'}, (response) => {
            if (chrome.runtime.lastError) {
                console.log('Error getting paper info:', chrome.runtime.lastError);
                return;
            }
            if (response && response.paperInfo) {
                const paperInfoDiv = document.querySelector('.paper-info');
                paperInfoDiv.innerHTML = `
                    <h3>${response.paperInfo.title || 'Paper Title'}</h3>
                    <p>Authors: ${response.paperInfo.authors || 'Author names here'}</p>
                    <p>Abstract: ${response.paperInfo.abstract || 'Paper abstract will appear here'}</p>
                `;
            }
        });
    } catch (error) {
        console.log('Chatbot: Error requesting paper info:', error);
    }
});
