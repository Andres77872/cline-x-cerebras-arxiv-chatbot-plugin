document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const loggedInSection = document.getElementById('loggedInSection');
  const showRegisterBtn = document.getElementById('showRegister');
  const showLoginBtn = document.getElementById('showLogin');
  const loginSubmitBtn = document.getElementById('loginSubmit');
  const registerSubmitBtn = document.getElementById('registerSubmit');
  const logoutBtn = document.getElementById('logoutBtn');
  const openChatbotBtn = document.getElementById('openChatbotBtn');
  const messageDiv = document.getElementById('message');
  const currentUsernameSpan = document.getElementById('currentUsername');

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
      // Use background script for API calls to avoid CORS issues
      const messagePayload = {
        action: 'apiRequest',
        url: 'http://127.0.0.1:8051/auth/login',
        options: {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ username, password })
        }
      };
      console.log('Popup: Sending message to background:', messagePayload);
      const response = await chrome.runtime.sendMessage(messagePayload);
      console.log('Popup: Received response from background:', response);

      if (response.success && response.data) {
        const data = response.data;
        if (data.success) {
          // Save session token to chrome storage
          await chrome.storage.local.set({ 
            sessionToken: data.session_token,
            username: data.username 
          });
          showMessage('Login successful!');
          showLoggedInSection(data.username);
          console.log('Session token saved:', data.session_token);
        } else {
          showMessage(data.message || 'Login failed', false);
        }
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

    try {
      // Use background script for API calls to avoid CORS issues
      const response = await chrome.runtime.sendMessage({
        action: 'apiRequest',
        url: 'http://127.0.0.1:8051/auth/register',
        options: {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({ username, password })
        }
      });

      if (response.success && response.data) {
        const data = response.data;
        if (data.success) {
          showMessage('Registration successful!');
          // Switch to login form after successful registration
          registerForm.classList.remove('active');
          loginForm.classList.add('active');
        } else {
          showMessage(data.message || 'Registration failed', false);
        }
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
    const chatbotUrl = chrome.runtime.getURL('chatbot.html');
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

  // Check if user is already logged in and show appropriate form
  chrome.storage.local.get(['sessionToken', 'username'], (result) => {
    if (result.sessionToken && result.username) {
      console.log('User already logged in:', result.username);
      showLoggedInSection(result.username);
    }
  });
});
