// Dashboard API module
const API_BASE_URL = 'https://col.arz.ai';

/**
 * Get authentication token from storage
 */
async function getAuthToken() {
    const result = await chrome.storage.local.get(['sessionToken']);
    return result.sessionToken;
}

/**
 * Make authenticated API request
 */
async function apiRequest(endpoint, options = {}) {
    const token = await getAuthToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...options.headers
        }
    });

    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

/**
 * Get user profile with basic statistics
 */
export async function getUserProfile() {
    return apiRequest('/dashboard/profile');
}

/**
 * Get chat-related metrics for a user
 */
export async function getChatMetrics() {
    return apiRequest('/dashboard/metrics/chats');
}

/**
 * Get document-related metrics for a user
 */
export async function getDocumentMetrics() {
    return apiRequest('/dashboard/metrics/documents');
}

/**
 * Get usage analytics for a user over specified days
 */
export async function getUsageAnalytics(days = 30) {
    return apiRequest(`/dashboard/analytics/usage?days=${days}`);
}

/**
 * Get recent activity for a user
 */
export async function getRecentActivity(limit = 10) {
    return apiRequest(`/dashboard/activity?limit=${limit}`);
}

/**
 * Get complete dashboard data for a user
 */
export async function getCompleteDashboard() {
    return apiRequest('/dashboard');
}

/**
 * Check API connection status
 */
export async function checkApiStatus() {
    try {
        const token = await getAuthToken();
        if (!token) {
            return { status: 'offline', message: 'Not authenticated' };
        }

        const response = await fetch(`${API_BASE_URL}/dashboard/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            return { status: 'online', message: 'Connected' };
        } else {
            return { status: 'offline', message: `HTTP ${response.status}` };
        }
    } catch (error) {
        return { status: 'offline', message: error.message };
    }
}
