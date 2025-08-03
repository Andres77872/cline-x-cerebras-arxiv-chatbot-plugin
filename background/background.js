// Background service worker for the Chrome extension
chrome.runtime.onInstalled.addListener(() => {
    console.log('Cline Chrome Plugin installed');
    // Perform setup tasks here
});

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Message received in background:', message);

    // Handle API requests from popup (for login/register)
    if (message.action === 'apiRequest') {
        fetch(message.url, message.options)
            .then(async (response) => {
                try {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    sendResponse({success: true, data: data});
                } catch (parseError) {
                    sendResponse({success: false, error: `Response parsing error: ${parseError.message}`});
                }
            })
            .catch((error) => {
                sendResponse({success: false, error: error.message});
            });
        return true; // Keep message channel open for async response
    }

    // Handle authenticated requests from content scripts
    if (message.action === 'authenticatedRequest') {
        makeAuthenticatedRequest(message.endpoint, message.options)
            .then(async (response) => {
                try {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    const data = await response.json();
                    sendResponse({success: true, data: data});
                } catch (parseError) {
                    sendResponse({success: false, error: `Response parsing error: ${parseError.message}`});
                }
            })
            .catch((error) => {
                sendResponse({success: false, error: error.message});
            });
        return true; // Keep message channel open for async response
    }

    // Handle logout request
    if (message.action === 'logout') {
        clearSessionToken()
            .then(() => {
                sendResponse({success: true, message: 'Logged out successfully'});
            })
            .catch((error) => {
                sendResponse({success: false, error: error.message});
            });
        return true; // Keep message channel open for async response
    }

    // Streaming is now handled directly in chatbot.js - no background script needed

    // Handle get paper info request from chatbot
    if (message.action === 'getPaperInfo') {
        // Get the active tab to retrieve paper information
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (chrome.runtime.lastError) {
                console.log('Error querying tabs:', chrome.runtime.lastError);
                sendResponse({paperInfo: null});
                return;
            }

            if (tabs.length > 0) {
                const activeTab = tabs[0];
                // Send message to content script to get paper info
                chrome.tabs.sendMessage(activeTab.id, {action: 'getPaperInfo'}, (response) => {
                    if (chrome.runtime.lastError) {
                        console.log('Error sending message to content script:', chrome.runtime.lastError);
                        sendResponse({paperInfo: null});
                        return;
                    }

                    if (response && response.paperInfo) {
                        sendResponse({paperInfo: response.paperInfo});
                    } else {
                        sendResponse({paperInfo: null});
                    }
                });
            } else {
                sendResponse({paperInfo: null});
            }
        });
        return true; // Keep message channel open for async response
    }

    // Handle open chatbot request from floating button
    if (message.action === 'openChatbot') {
        console.log('Opening chatbot from floating button');
        const chatbotUrl = chrome.runtime.getURL('ui/chatbot.html');
        console.log('Chatbot URL:', chatbotUrl);

        chrome.windows.create({
            url: chatbotUrl,
            type: 'popup',
            width: 450,
            height: 600
        }, (window) => {
            if (chrome.runtime.lastError) {
                console.error('Error creating chatbot window:', chrome.runtime.lastError);
                sendResponse({success: false, error: chrome.runtime.lastError.message});
            } else {
                console.log('Chatbot window created:', window);
                sendResponse({success: true, message: 'Chatbot opened successfully!'});
            }
        });
        return true; // Keep message channel open for async response
    }
    
    // Handle centralized LLM requests from content script
    if (message.action === 'fetchChatCompletion') {
        console.log('Handling centralized LLM request:', message);
        
        // Inline LLM functionality (avoiding dynamic imports in service worker)
        handleLLMRequest(message.model, message.messages, message.arxivPaperUrl, sendResponse);
        
        return true; // Keep message channel open for async response
    }
});

// Function to get session token from storage
async function getSessionToken() {
    try {
        const result = await chrome.storage.local.get(['sessionToken']);
        return result.sessionToken || null;
    } catch (error) {
        console.error('Error getting session token:', error);
        return null;
    }
}

// Function to make authenticated API calls
async function makeAuthenticatedRequest(url, options = {}) {
    const sessionToken = await getSessionToken();

    if (!sessionToken) {
        throw new Error('No session token available');
    }

    // Add session token to headers
    const headers = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${sessionToken}`,
        ...options.headers
    };

    const fetchOptions = {
        ...options,
        headers
    };

    return fetch(url, fetchOptions);
}

// Function to clear session token (for logout)
async function clearSessionToken() {
    try {
        await chrome.storage.local.remove(['sessionToken', 'username']);
        console.log('Session token cleared');
    } catch (error) {
        console.error('Error clearing session token:', error);
    }
}

// Centralized LLM request handler (inline to avoid service worker import restrictions)
async function handleLLMRequest(model, messages, arxivPaperUrl, sendResponse) {
    try {
        // Get API URL and session token from storage
        const { apiUrl, sessionToken } = await chrome.storage.local.get({ 
            apiUrl: 'http://127.0.0.1:8051/openai/chat/completions',
            sessionToken: null
        });
        
        console.log('Making centralized LLM API request to:', apiUrl);
        console.log('Background: Request payload:', { model, messages, arxiv_paper_url: arxivPaperUrl, stream: true });
        console.log('Background: Using session token:', sessionToken ? 'Token present' : 'No token found');
        
        // Prepare headers with authorization
        const headers = {
            'accept': 'application/json',
            'Content-Type': 'application/json',
        };
        
        // Add authorization header if session token exists
        if (sessionToken) {
            headers['Authorization'] = `Bearer ${sessionToken}`;
        }
        
        // Make the API request directly
        fetch(apiUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: model || 'local-model',
                messages: Array.isArray(messages) ? messages : [messages],
                arxiv_paper_url: arxivPaperUrl || '',
                stream: true,
                max_tokens: 2000,
                temperature: 0.7
            })
        })
        .then(async (response) => {
            console.log('Centralized LLM API response status:', response.status);
            
            if (!response.ok) {
                // For 422 errors, try to get the error details
                let errorDetails = 'Unknown error';
                try {
                    const errorText = await response.text();
                    console.error('API Error Response Body:', errorText);
                    errorDetails = errorText || `HTTP ${response.status}`;
                } catch (e) {
                    console.error('Could not read error response:', e);
                }
                throw new Error(`HTTP error! status: ${response.status}, details: ${errorDetails}`);
            }
            
            // Handle streaming response
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let fullResponse = '';
            
            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;
                
                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                
                // Process complete lines
                const lines = buffer.split('\n');
                buffer = lines.pop(); // Keep incomplete line in buffer
                
                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const cleanLine = line.replace(/^data: /, '');
                            if (cleanLine === '[DONE]') continue;
                            
                            const parsed = JSON.parse(cleanLine);
                            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                                const content = parsed.choices[0].delta.content || '';
                                fullResponse += content;
                            }
                        } catch (e) {
                            console.warn('Error parsing streaming chunk:', e, 'Line:', line);
                        }
                    }
                }
            }
            
            // Process any remaining buffer
            if (buffer.trim()) {
                try {
                    const cleanLine = buffer.replace(/^data: /, '');
                    if (cleanLine !== '[DONE]') {
                        const parsed = JSON.parse(cleanLine);
                        if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                            const content = parsed.choices[0].delta.content || '';
                            fullResponse += content;
                        }
                    }
                } catch (e) {
                    console.warn('Error parsing final chunk:', e, 'Buffer:', buffer);
                }
            }
            
            console.log('Complete centralized LLM response:', fullResponse);
            sendResponse({ success: true, data: fullResponse });
        })
        .catch((error) => {
            console.error('Centralized LLM API error:', error);
            sendResponse({ success: false, error: error.message });
        });
        
    } catch (error) {
        console.error('Error in handleLLMRequest:', error);
        sendResponse({ success: false, error: error.message });
    }
}
