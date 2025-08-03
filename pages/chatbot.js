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
            
            // Direct streaming API call
            const apiUrl = 'http://127.0.0.1:8051/openai/chat/completions';
            
            fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'local-model',
                    messages: messages,
                    arxiv_paper_url: arxivUrl,
                    stream: true
                })
            })
            .then(async (response) => {
                console.log('API response status:', response.status);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                // Handle streaming response
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';
                
                // Remove loading indicator immediately when streaming starts
                if (loadingElement.parentNode) {
                    loadingElement.remove();
                }
                
                // Create bot message element immediately
                if (!botMessageElement) {
                    botMessageElement = document.createElement('div');
                    botMessageElement.className = 'message bot-message';
                    botMessageElement.textContent = '';
                    chatMessages.appendChild(botMessageElement);
                    chatMessages.scrollTop = chatMessages.scrollHeight;
                }
                
                try {
                    while (true) {
                        const { done, value } = await reader.read();
                        
                        if (done) break;
                        
                        const chunk = decoder.decode(value, { stream: true });
                        buffer += chunk;
                        
                        // Process complete lines from buffer
                        const lines = buffer.split('\n');
                        buffer = lines.pop() || ''; // Keep incomplete line in buffer
                        
                        for (const line of lines) {
                            if (line.trim()) {
                                try {
                                    // Handle both raw JSON and SSE format
                                    const cleanLine = line.replace(/^data: /, '').trim();
                                    if (cleanLine === '[DONE]') continue;
                                    if (cleanLine === '') continue;
                                    
                                    const parsedChunk = JSON.parse(cleanLine);
                                    console.log('Received chunk:', parsedChunk);
                                    
                                    if (parsedChunk.choices && parsedChunk.choices[0] && parsedChunk.choices[0].delta) {
                                        const content = parsedChunk.choices[0].delta.content || '';
                                        if (content) {
                                            currentResponse += content;
                                            
                                            // Update UI immediately with new content
                                            botMessageElement.textContent = currentResponse;
                                            chatMessages.scrollTop = chatMessages.scrollHeight;
                                            
                                            // Force a reflow to ensure immediate update
                                            botMessageElement.offsetHeight;
                                        }
                                    }
                                } catch (e) {
                                    console.error('Error parsing chunk:', e, 'Line:', line);
                                }
                            }
                        }
                        
                        // Add a small delay to prevent overwhelming the UI
                        await new Promise(resolve => setTimeout(resolve, 10));
                    }
                    
                    // Process any remaining buffer
                    if (buffer.trim()) {
                        try {
                            const cleanLine = buffer.replace(/^data: /, '').trim();
                            if (cleanLine !== '[DONE]' && cleanLine !== '') {
                                const parsedChunk = JSON.parse(cleanLine);
                                console.log('Final chunk:', parsedChunk);
                                
                                if (parsedChunk.choices && parsedChunk.choices[0] && parsedChunk.choices[0].delta) {
                                    const content = parsedChunk.choices[0].delta.content || '';
                                    if (content) {
                                        currentResponse += content;
                                        
                                        if (botMessageElement) {
                                            botMessageElement.textContent = currentResponse;
                                            chatMessages.scrollTop = chatMessages.scrollHeight;
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            console.error('Error parsing final chunk:', e);
                        }
                    }
                    
                    // Completion - ensure we have content
                    if (currentResponse) {
                        messages.push({ role: 'assistant', content: currentResponse });
                        console.log('Complete response received:', currentResponse);
                        console.log('Streaming completed successfully');
                    } else {
                        // If no streaming response, show fallback message
                        console.warn('No content received from streaming');
                        if (botMessageElement) {
                            botMessageElement.textContent = 'No response received from the API server.';
                        } else {
                            addMessage('No response received from the API server.');
                        }
                    }
                    
                    // Reset for next message
                    currentResponse = '';
                    botMessageElement = null;
                    
                } catch (readError) {
                    console.error('Error reading stream:', readError);
                    throw readError;
                }
            })
            .catch(error => {
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
