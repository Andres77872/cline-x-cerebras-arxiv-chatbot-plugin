// Handles streaming chat completions from OpenAI-compatible API via background script
export async function fetchChatCompletion(model, messages, arxivPaperUrl, onChunk) {
  // Get API URL from storage or use default
  const { apiUrl } = await chrome.storage.local.get({ 
    apiUrl: 'http://127.0.0.1:8051/openai/chat/completions' 
  });
  
  console.log('Making streaming API request to:', apiUrl);
  
  // Send message to background script to handle the streaming request
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: 'streamingApiRequest',
      url: apiUrl,
      payload: {
        model,
        messages,
        arxiv_paper_url: arxivPaperUrl,
        stream: true
      }
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Chrome runtime error:', chrome.runtime.lastError);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      
      if (response && response.error) {
        console.error('API error:', response.error);
        reject(new Error(response.error));
        return;
      }
      
      if (response && response.success) {
        // Parse the streamed response
        const chunks = response.data.split('\n').filter(line => line.trim());
        
        chunks.forEach(line => {
          try {
            // Handle both raw JSON and SSE format
            const cleanLine = line.replace(/^data: /, '');
            if (cleanLine === '[DONE]') return;
            
            const chunk = JSON.parse(cleanLine);
            onChunk(chunk);
          } catch (e) {
            console.error('Error parsing chunk:', e, 'Line:', line);
          }
        });
        
        resolve();
      } else {
        reject(new Error('Invalid response format'));
      }
    });
  });
}
