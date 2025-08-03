// Chrome Messaging Module
// Handles Chrome extension messaging and storage operations

window.ArxivChatbot = window.ArxivChatbot || {};
window.ArxivChatbot.ChromeMessaging = class {
    constructor() {
        this.messageHandlers = new Map();
        this.setupMessageListener();
    }

    // Setup Chrome runtime message listener
    setupMessageListener() {
        if (chrome && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
                return this.handleMessage(message, sender, sendResponse);
            });
        }
    }

    // Handle incoming messages
    handleMessage(message, sender, sendResponse) {
        const handler = this.messageHandlers.get(message.action);
        
        if (handler) {
            try {
                const result = handler(message, sender);
                
                // Handle both sync and async responses
                if (result instanceof Promise) {
                    result.then(sendResponse).catch(error => {
                        console.error('Message handler error:', error);
                        sendResponse({ error: error.message });
                    });
                    return true; // Keep message channel open for async response
                } else {
                    sendResponse(result);
                    return false;
                }
            } catch (error) {
                console.error('Message handler error:', error);
                sendResponse({ error: error.message });
                return false;
            }
        } else {
            console.warn('No handler for message action:', message.action);
            sendResponse({ error: 'Unknown action' });
            return false;
        }
    }

    // Register message handler
    onMessage(action, handler) {
        this.messageHandlers.set(action, handler);
    }

    // Remove message handler
    offMessage(action) {
        this.messageHandlers.delete(action);
    }

    // Send message to background script
    async sendToBackground(message) {
        return new Promise((resolve, reject) => {
            if (!chrome || !chrome.runtime) {
                reject(new Error('Chrome runtime not available'));
                return;
            }

            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else {
                    resolve(response);
                }
            });
        });
    }

    // Send message to popup
    async sendToPopup(message) {
        try {
            return await this.sendToBackground({
                action: 'forwardToPopup',
                data: message
            });
        } catch (error) {
            console.error('Failed to send message to popup:', error);
            throw error;
        }
    }

    // Chrome storage helpers
    storage = {
        // Get data from Chrome storage
        get: async (keys) => {
            return new Promise((resolve, reject) => {
                if (!chrome || !chrome.storage) {
                    reject(new Error('Chrome storage not available'));
                    return;
                }

                chrome.storage.local.get(keys, (result) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(result);
                    }
                });
            });
        },

        // Set data in Chrome storage
        set: async (data) => {
            return new Promise((resolve, reject) => {
                if (!chrome || !chrome.storage) {
                    reject(new Error('Chrome storage not available'));
                    return;
                }

                chrome.storage.local.set(data, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
        },

        // Remove data from Chrome storage
        remove: async (keys) => {
            return new Promise((resolve, reject) => {
                if (!chrome || !chrome.storage) {
                    reject(new Error('Chrome storage not available'));
                    return;
                }

                chrome.storage.local.remove(keys, () => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
        },

        // Clear all Chrome storage
        clear: async () => {
            return new Promise((resolve, reject) => {
                if (!chrome || !chrome.storage) {
                    reject(new Error('Chrome storage not available'));
                    return;
                }

                chrome.storage.local.clear(() => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve();
                    }
                });
            });
        }
    };

    // Authentication helpers
    auth = {
        // Check if user is logged in
        isLoggedIn: async () => {
            try {
                const result = await this.storage.get(['sessionToken', 'username']);
                return !!(result.sessionToken && result.username);
            } catch (error) {
                console.error('Failed to check login status:', error);
                return false;
            }
        },

        // Get current user info
        getCurrentUser: async () => {
            try {
                const result = await this.storage.get(['sessionToken', 'username']);
                return {
                    token: result.sessionToken,
                    username: result.username,
                    email: result.email
                };
            } catch (error) {
                console.error('Failed to get current user:', error);
                return null;
            }
        },

        // Logout user
        logout: async () => {
            try {
                await this.storage.remove(['sessionToken', 'username']);
                return true;
            } catch (error) {
                console.error('Failed to logout:', error);
                return false;
            }
        }
    };

    // API client for authenticated requests
    createApiClient() {
        return {
            makeAuthenticatedRequest: async (endpoint, options = {}) => {
                try {
                    // Get the auth token directly from storage (like dashboard requests)
                    const storageResult = await this.storage.get(['sessionToken']);
                    const token = storageResult.sessionToken;
                    
                    if (!token) {
                        throw new Error('No authentication token found. Please log in first.');
                    }
                    
                    // Setup request options with auth headers
                    const requestOptions = {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,
                            ...options.headers
                        },
                        ...options
                    };

                    // Make request through background script to avoid ad blocker blocking
                    const baseUrl = 'http://127.0.0.1:8051'; // TODO: Make this configurable
                    const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${endpoint}`;
                    
                    // Send request to background script
                    const result = await new Promise((resolve, reject) => {
                        chrome.runtime.sendMessage({
                            action: 'authenticatedRequest',
                            endpoint: url,
                            options: requestOptions
                        }, (response) => {
                            if (chrome.runtime.lastError) {
                                reject(new Error(chrome.runtime.lastError.message));
                                return;
                            }
                            if (response.success) {
                                resolve(response);
                            } else {
                                reject(new Error(response.error || 'API request failed'));
                            }
                        });
                    });
                    
                    // Create a response-like object for compatibility
                    const response = {
                        ok: true,
                        status: 200,
                        json: async () => result.data,
                        text: async () => JSON.stringify(result.data)
                    };
                    
                    return response;

                } catch (error) {
                    console.error('API request failed:', error);
                    
                    // Handle authentication errors
                    if (error.message.includes('401') || error.message.includes('Authentication')) {
                        await this.auth.logout();
                        throw new Error('Authentication expired. Please log in again.');
                    }
                    
                    throw error;
                }
            }
        };
    }

    // Tab management helpers
    tabs = {
        // Get current tab info
        getCurrent: async () => {
            return new Promise((resolve, reject) => {
                if (!chrome || !chrome.tabs) {
                    reject(new Error('Chrome tabs API not available'));
                    return;
                }

                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(tabs[0] || null);
                    }
                });
            });
        },

        // Execute script in current tab
        executeScript: async (details) => {
            return new Promise((resolve, reject) => {
                if (!chrome || !chrome.scripting) {
                    reject(new Error('Chrome scripting API not available'));
                    return;
                }

                chrome.scripting.executeScript(details, (results) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(results);
                    }
                });
            });
        }
    };

    // Permission helpers
    permissions = {
        // Check if permission is granted
        contains: async (permissions) => {
            return new Promise((resolve, reject) => {
                if (!chrome || !chrome.permissions) {
                    reject(new Error('Chrome permissions API not available'));
                    return;
                }

                chrome.permissions.contains(permissions, (result) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(result);
                    }
                });
            });
        },

        // Request permission
        request: async (permissions) => {
            return new Promise((resolve, reject) => {
                if (!chrome || !chrome.permissions) {
                    reject(new Error('Chrome permissions API not available'));
                    return;
                }

                chrome.permissions.request(permissions, (granted) => {
                    if (chrome.runtime.lastError) {
                        reject(new Error(chrome.runtime.lastError.message));
                    } else {
                        resolve(granted);
                    }
                });
            });
        }
    };

    // Utility to check if running in extension context
    isExtensionContext() {
        return !!(chrome && chrome.runtime && chrome.runtime.id);
    }

    // Get extension info
    getExtensionInfo() {
        if (!this.isExtensionContext()) {
            return null;
        }

        return {
            id: chrome.runtime.id,
            manifest: chrome.runtime.getManifest(),
            url: chrome.runtime.getURL('')
        };
    }
}
