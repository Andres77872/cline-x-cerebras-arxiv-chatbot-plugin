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

// Add your page-specific functionality here

if (window.location.hostname === 'arxiv.org' && 
    (window.location.pathname.startsWith('/abs/') || 
     window.location.pathname.startsWith('/pdf/'))) {
  // Create floating chat button
  const button = document.createElement('button');
  button.id = 'arxiv-chatbot-button';
  button.textContent = 'Chat with Paper';
  button.style.position = 'fixed';
  button.style.bottom = '20px';
  button.style.right = '20px';
  button.style.zIndex = '9999';
  button.style.padding = '10px 20px';
  button.style.backgroundColor = '#007bff';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '5px';
  button.style.cursor = 'pointer';
  button.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';

  button.addEventListener('click', () => {
    console.log('ArXiv chat button clicked');
    // Add your chat functionality here
  });

  document.body.appendChild(button);
}
