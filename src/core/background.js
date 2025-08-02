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
