import { loginUrl, registerUrl, login, register } from '../scripts/api/auth.js';
import { 
    getUserProfile, 
    getChatMetrics, 
    getDocumentMetrics, 
    getUsageAnalytics, 
    getRecentActivity, 
    getCompleteDashboard,
    checkApiStatus 
} from '../scripts/api/dashboard.js';

document.addEventListener('DOMContentLoaded', () => {
    // Form sections
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loggedInSection = document.getElementById('loggedInSection');
    const configSection = document.getElementById('configSection');
    const dashboardSection = document.getElementById('dashboardSection');
    
    // Navigation tabs
    const navTabs = document.querySelectorAll('.nav-tab');
    
    // Auth elements
    const showRegisterBtn = document.getElementById('showRegister');
    const showLoginBtn = document.getElementById('showLogin');
    const loginSubmitBtn = document.getElementById('loginSubmit');
    const registerSubmitBtn = document.getElementById('registerSubmit');
    const logoutBtn = document.getElementById('logoutBtn');
    const openChatbotBtn = document.getElementById('openChatbotBtn');
    const messageDiv = document.getElementById('message');
    const currentUsernameSpan = document.getElementById('currentUsername');
    
    // Configuration elements
    const saveConfigBtn = document.getElementById('saveConfig');
    const resetConfigBtn = document.getElementById('resetConfig');
    const temperatureSlider = document.getElementById('temperature');
    const temperatureValue = document.getElementById('temperatureValue');
    
    // Dashboard elements
    const clearDataBtn = document.getElementById('clearData');
    const exportDataBtn = document.getElementById('exportData');
    const refreshDashboardBtn = document.getElementById('refreshDashboard');
    
    // Default configuration
    const defaultConfig = {
        apiEndpoint: 'http://localhost:8051',
        apiKey: '',
        requestTimeout: 30,
        defaultModel: 'llama3.1-8b',
        maxTokens: 1000,
        temperature: 0.7,
        autoSummarize: true,
        showNotifications: true,
        saveHistory: true
    };
    
    // Initialize statistics
    const defaultStats = {
        papersProcessed: 0,
        queriesMade: 0,
        tokensUsed: 0,
        lastActivity: 'Never',
        recentActivity: []
    };

    // Function to show messages
    function showMessage(text, isSuccess = true) {
        messageDiv.textContent = text;
        messageDiv.className = 'message ' + (isSuccess ? 'success' : 'error');
        messageDiv.style.display = 'block';

        // Hide message after 3 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 3000);
    }

    // Function to show logged in section
    function showLoggedInSection(username) {
        currentUsernameSpan.textContent = username;
        loginForm.classList.remove('active');
        registerForm.classList.remove('active');
        loggedInSection.classList.add('active');
    }

    // Function to show login form
    function showLoginForm() {
        loggedInSection.classList.remove('active');
        loginForm.classList.add('active');
    }

    // Switch to registration form
    showRegisterBtn.addEventListener('click', () => {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    });

    // Switch to login form
    showLoginBtn.addEventListener('click', () => {
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    });

    // Handle logout
    logoutBtn.addEventListener('click', async () => {
        try {
            await chrome.storage.local.remove(['sessionToken', 'username']);
            showMessage('Logged out successfully');
            setTimeout(() => {
                showLoginForm();
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            showMessage('Logout failed: ' + error.message, false);
        }
    });

    // Handle login submission
    loginSubmitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        if (!username || !password) {
            showMessage('Please fill in all fields', false);
            return;
        }

        try {
            console.log('Popup: Attempting login for user:', username);
            const response = await login(username, password);
            console.log('Popup: Received response from background:', response);

            if (response.success && response.data) {
                const data = response.data;
                // Save session token to chrome storage
                await chrome.storage.local.set({
                    sessionToken: data.session_token,
                    username: data.username
                });
                showMessage('Login successful!');
                showLoggedInSection(data.username);
                console.log('Session token saved:', data.session_token);
            } else {
                showMessage(response.error || 'Login failed', false);
            }
        } catch (error) {
            console.error('Login error:', error);
            showMessage('Network error: ' + error.message, false);
        }
    });

    // Handle registration submission
    registerSubmitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirm').value;

        if (!username || !password || !confirmPassword) {
            showMessage('Please fill in all fields', false);
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords do not match', false);
            return;
        }

        if (password.length < 6) {
            showMessage('Password must be at least 6 characters long', false);
            return;
        }

        try {
            console.log('Popup: Attempting registration for user:', username);
            const response = await register(username, password);
            console.log('Popup: Received registration response from background:', response);

            if (response.success && response.data) {
                showMessage('Registration successful!');
                // Clear form fields
                document.getElementById('registerUsername').value = '';
                document.getElementById('registerPassword').value = '';
                document.getElementById('registerConfirm').value = '';
                // Switch to login form after successful registration
                registerForm.classList.remove('active');
                loginForm.classList.add('active');
            } else {
                showMessage(response.error || 'Registration failed', false);
            }
        } catch (error) {
            console.error('Registration error:', error);
            showMessage('Network error: ' + error.message, false);
        }
    });

    // Handle open chatbot button
    openChatbotBtn.addEventListener('click', () => {
        console.log('Open chatbot button clicked');
        const chatbotUrl = chrome.runtime.getURL('pages/chatbot.html');
        console.log('Chatbot URL:', chatbotUrl);

        chrome.windows.create({
            url: chatbotUrl,
            type: 'popup',
            width: 450,
            height: 600
        }, (window) => {
            if (chrome.runtime.lastError) {
                console.error('Error creating chatbot window:', chrome.runtime.lastError);
                showMessage('Failed to open chatbot: ' + chrome.runtime.lastError.message, false);
            } else {
                console.log('Chatbot window created:', window);
                showMessage('Chatbot opened successfully!');
            }
        });
    });

    // Navigation tab functionality
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetSection = tab.getAttribute('data-section');
            switchToSection(targetSection);
        });
    });
    
    function switchToSection(sectionId) {
        // Remove active class from all tabs and sections
        navTabs.forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Add active class to clicked tab
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        
        // Show target section
        const targetElement = document.getElementById(sectionId);
        if (targetElement) {
            targetElement.classList.add('active');
        }
        
        // Load data when switching to dashboard
        if (sectionId === 'dashboardSection') {
            loadDashboardData();
        }
    }
    
    // Configuration functionality
    function loadConfiguration() {
        chrome.storage.local.get(['extensionConfig'], (result) => {
            const config = result.extensionConfig || defaultConfig;
            
            document.getElementById('apiEndpoint').value = config.apiEndpoint;
            document.getElementById('apiKey').value = config.apiKey;
            document.getElementById('requestTimeout').value = config.requestTimeout;
            document.getElementById('defaultModel').value = config.defaultModel;
            document.getElementById('maxTokens').value = config.maxTokens;
            document.getElementById('temperature').value = config.temperature;
            document.getElementById('temperatureValue').textContent = config.temperature;
            document.getElementById('autoSummarize').checked = config.autoSummarize;
            document.getElementById('showNotifications').checked = config.showNotifications;
            document.getElementById('saveHistory').checked = config.saveHistory;
        });
    }
    
    function saveConfiguration() {
        const config = {
            apiEndpoint: document.getElementById('apiEndpoint').value,
            apiKey: document.getElementById('apiKey').value,
            requestTimeout: parseInt(document.getElementById('requestTimeout').value),
            defaultModel: document.getElementById('defaultModel').value,
            maxTokens: parseInt(document.getElementById('maxTokens').value),
            temperature: parseFloat(document.getElementById('temperature').value),
            autoSummarize: document.getElementById('autoSummarize').checked,
            showNotifications: document.getElementById('showNotifications').checked,
            saveHistory: document.getElementById('saveHistory').checked
        };
        
        chrome.storage.local.set({ extensionConfig: config }, () => {
            showMessage('Configuration saved successfully!');
            // Update dashboard if it's visible
            updateApiStatus();
        });
    }
    
    function resetConfiguration() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            chrome.storage.local.set({ extensionConfig: defaultConfig }, () => {
                loadConfiguration();
                showMessage('Configuration reset to defaults!');
            });
        }
    }
    
    // Dashboard functionality - Load data from API
    async function loadDashboardData() {
        try {
            // Check API status first
            await updateApiStatus();
            
            // Check if user is authenticated
            const result = await chrome.storage.local.get(['sessionToken']);
            if (!result.sessionToken) {
                setAllDashboardValues('Not authenticated');
                return;
            }

            // Load complete dashboard data
            const dashboardData = await getCompleteDashboard();
            
            // Update user profile section
            updateUserProfile(dashboardData.user_profile);
            
            // Update chat metrics section
            updateChatMetrics(dashboardData.chat_metrics);
            
            // Update document metrics section
            updateDocumentMetrics(dashboardData.document_metrics);
            
            // Update usage analytics section
            updateUsageAnalytics(dashboardData.usage_analytics);
            
            // Update recent activity section
            updateRecentActivity(dashboardData.recent_activity);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setAllDashboardValues(`Error: ${error.message}`);
        }
    }

    // Helper function to set all dashboard values to a single message
    function setAllDashboardValues(message) {
        const elements = [
            'userId', 'memberSince', 'totalChats', 'activeChats', 'recentChats', 'avgUsagePerChat',
            'totalDocuments', 'indexedDocuments', 'pendingDocuments', 'failedDocuments', 
            'totalPagesProcessed', 'totalUsage', 'chatUsage', 'documentUsage'
        ];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = message;
        });
    }
    
    // Update user profile section
    function updateUserProfile(profile) {
        document.getElementById('userId').textContent = profile.user_id;
        document.getElementById('memberSince').textContent = new Date(profile.created_at).toLocaleDateString();
    }
    
    // Update chat metrics section
    function updateChatMetrics(metrics) {
        document.getElementById('totalChats').textContent = metrics.total_chats.toLocaleString();
        document.getElementById('activeChats').textContent = metrics.active_chats.toLocaleString();
        document.getElementById('recentChats').textContent = metrics.recent_chats.toLocaleString();
        document.getElementById('avgUsagePerChat').textContent = metrics.average_usage_per_chat.toFixed(2);
    }
    
    // Update document metrics section
    function updateDocumentMetrics(metrics) {
        document.getElementById('totalDocuments').textContent = metrics.total_documents.toLocaleString();
        document.getElementById('indexedDocuments').textContent = metrics.indexed_documents.toLocaleString();
        document.getElementById('pendingDocuments').textContent = metrics.pending_documents.toLocaleString();
        document.getElementById('failedDocuments').textContent = metrics.failed_documents.toLocaleString();
        document.getElementById('totalPagesProcessed').textContent = metrics.total_pages_processed.toLocaleString();
    }
    
    // Update usage analytics section
    function updateUsageAnalytics(analytics) {
        document.getElementById('totalUsage').textContent = analytics.total_usage.toFixed(2);
        document.getElementById('chatUsage').textContent = analytics.chat_usage.toFixed(2);
        document.getElementById('documentUsage').textContent = analytics.document_usage.toFixed(2);
    }
    
    function updateRecentActivity(activities) {
        const recentActivityDiv = document.getElementById('recentActivity');
        
        if (!activities || activities.length === 0) {
            recentActivityDiv.innerHTML = '<p style="color: #6c757d; text-align: center; margin: 20px 0;">No recent activity</p>';
            return;
        }
        
        let activityHtml = '';
        activities.slice(0, 5).forEach(activity => {
            const timestamp = activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown time';
            const description = activity.description || activity.action || 'Unknown activity';
            
            activityHtml += `
                <div class="activity-item" style="padding: 8px 0; border-bottom: 1px solid #eee;">
                    <div style="font-size: 12px; color: #666;">${timestamp}</div>
                    <div style="font-size: 14px; color: #333;">${description}</div>
                </div>
            `;
        });
        
        recentActivityDiv.innerHTML = activityHtml;
    }

    async function updateApiStatus() {
        const apiStatus = document.getElementById('apiStatus');
        const statusIndicator = document.querySelector('.status-indicator');
        
        try {
            const status = await checkApiStatus();
            apiStatus.textContent = status.status === 'online' ? 'Connected' : status.message;
            statusIndicator.className = `status-indicator status-${status.status}`;
        } catch (error) {
            apiStatus.textContent = 'Offline';
            statusIndicator.className = 'status-indicator status-offline';
        }
    }

    // Handle open chatbot button
    openChatbotBtn.addEventListener('click', () => {
        console.log('Open chatbot button clicked');
        const chatbotUrl = chrome.runtime.getURL('pages/chatbot.html');
        console.log('Chatbot URL:', chatbotUrl);

        chrome.windows.create({
            url: chatbotUrl,
            type: 'popup',
            width: 450,
            height: 600
        }, (window) => {
            if (chrome.runtime.lastError) {
                console.error('Error creating chatbot window:', chrome.runtime.lastError);
                showMessage('Failed to open chatbot: ' + chrome.runtime.lastError.message, false);
            } else {
                console.log('Chatbot window created:', window);
                showMessage('Chatbot opened successfully!');
            }
        });
    });

    // Navigation tab functionality
    navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetSection = tab.getAttribute('data-section');
            switchToSection(targetSection);
        });
    });
    
    function switchToSection(sectionId) {
        // Remove active class from all tabs and sections
        navTabs.forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.form-section').forEach(section => {
            section.classList.remove('active');
        });
        
        // Add active class to clicked tab
        document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');
        
        // Show target section
        const targetElement = document.getElementById(sectionId);
        if (targetElement) {
            targetElement.classList.add('active');
        }
        
        // Load data when switching to dashboard
        if (sectionId === 'dashboardSection') {
            loadDashboardData();
        }
    }

    // Configuration functionality
    function loadConfiguration() {
        chrome.storage.local.get(['extensionConfig'], (result) => {
            const config = result.extensionConfig || defaultConfig;
            
            document.getElementById('apiEndpoint').value = config.apiEndpoint;
            document.getElementById('apiKey').value = config.apiKey;
            document.getElementById('requestTimeout').value = config.requestTimeout;
            document.getElementById('defaultModel').value = config.defaultModel;
            document.getElementById('maxTokens').value = config.maxTokens;
            document.getElementById('temperature').value = config.temperature;
            document.getElementById('temperatureValue').textContent = config.temperature;
            document.getElementById('autoSummarize').checked = config.autoSummarize;
            document.getElementById('showNotifications').checked = config.showNotifications;
            document.getElementById('saveHistory').checked = config.saveHistory;
        });
    }

    function saveConfiguration() {
        const config = {
            apiEndpoint: document.getElementById('apiEndpoint').value,
            apiKey: document.getElementById('apiKey').value,
            requestTimeout: parseInt(document.getElementById('requestTimeout').value),
            defaultModel: document.getElementById('defaultModel').value,
            maxTokens: parseInt(document.getElementById('maxTokens').value),
            temperature: parseFloat(document.getElementById('temperature').value),
            autoSummarize: document.getElementById('autoSummarize').checked,
            showNotifications: document.getElementById('showNotifications').checked,
            saveHistory: document.getElementById('saveHistory').checked
        };
        
        chrome.storage.local.set({ extensionConfig: config }, () => {
            showMessage('Configuration saved successfully!');
            // Update dashboard if it's visible
            updateApiStatus();
        });
    }

    function resetConfiguration() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            chrome.storage.local.set({ extensionConfig: defaultConfig }, () => {
                loadConfiguration();
                showMessage('Configuration reset to defaults!');
            });
        }
    }

    function clearAllData() {
        if (confirm('Are you sure you want to clear all extension data? This action cannot be undone.')) {
            chrome.storage.local.clear(() => {
                // Reset to default values
                chrome.storage.local.set({ 
                    extensionConfig: defaultConfig,
                    extensionStats: defaultStats 
                }, () => {
                    showMessage('All data cleared successfully!');
                    loadConfiguration();
                    loadDashboardData();
                });
            });
        }
    }

    function exportData() {
        chrome.storage.local.get(null, (result) => {
            const dataStr = JSON.stringify(result, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `arxiv-reader-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showMessage('Data exported successfully!');
        });
    }

    // Event listeners for configuration
    saveConfigBtn.addEventListener('click', saveConfiguration);
    resetConfigBtn.addEventListener('click', resetConfiguration);
    
    // Temperature slider update
    temperatureSlider.addEventListener('input', (e) => {
        temperatureValue.textContent = e.target.value;
    });
    
    // Event listeners for dashboard
    clearDataBtn.addEventListener('click', clearAllData);
    exportDataBtn.addEventListener('click', exportData);
    refreshDashboardBtn.addEventListener('click', loadDashboardData);
    
    // Initialize configuration on load
    loadConfiguration();
    
    // Check if user is already logged in and show appropriate form
    chrome.storage.local.get(['sessionToken', 'username'], (result) => {
        if (result.sessionToken && result.username) {
            console.log('User already logged in:', result.username);
            showLoggedInSection(result.username);
        }
    });
});
