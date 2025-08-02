// Content script for the Chrome extension
console.log('Cline content script loaded on:', window.location.href);

// Example function to make authenticated API calls to the backend
async function makeAuthenticatedRequestToBackend(endpoint, options = {}) {
  try {
    // Send message to background script to get session token and make request
    const response = await chrome.runtime.sendMessage({
      action: 'authenticatedRequest',
      endpoint: endpoint,
      options: options
    });
    return response;
  } catch (error) {
    console.error('Authenticated request failed:', error);
    throw error;
  }
}

// Example function to logout
async function logout() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'logout'
    });
    return response;
  } catch (error) {
    console.error('Logout failed:', error);
    throw error;
  }
}

// Example usage of authenticated API calls
async function exampleAuthenticatedAPI() {
  try {
    // This would be used for any API calls that require authentication
    // const data = await makeAuthenticatedRequestToBackend('/api/protected-endpoint');
    // console.log('API response:', data);
    
    // Example of making a GET request to a protected endpoint
    // const getResult = await makeAuthenticatedRequestToBackend('http://127.0.0.1:8051/api/user-data', {
    //   method: 'GET'
    // });
    
    // Example of making a POST request to a protected endpoint
    // const postResult = await makeAuthenticatedRequestToBackend('http://127.0.0.1:8051/api/save-data', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ data: 'example data' })
    // });
  } catch (error) {
    console.error('API call error:', error);
  }
}

// Add your page-specific functionality here
