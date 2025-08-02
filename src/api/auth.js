const BASE_URL = 'http://127.0.0.1:8051';

export function loginUrl() {
  return `${BASE_URL}/auth/login`;
}

export function registerUrl() {
  return `${BASE_URL}/auth/register`;
}

export async function login(username, password) {
  const messagePayload = {
    action: 'apiRequest',
    url: loginUrl(),
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password })
    }
  };
  return chrome.runtime.sendMessage(messagePayload);
}

export async function register(username, password) {
  const messagePayload = {
    action: 'apiRequest',
    url: registerUrl(),
    options: {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password })
    }
  };
  return chrome.runtime.sendMessage(messagePayload);
}
