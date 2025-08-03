// Floating Button Module
// Creates and manages the floating chat button

window.ArxivChatbot = window.ArxivChatbot || {};
window.ArxivChatbot.FloatingButton = class {
    constructor() {
        this.buttonId = 'arxiv-chatbot-float-btn';
        this.onMenuToggle = null;
    }

    // Create and inject floating chatbot button
    create(onMenuToggle) {
        this.onMenuToggle = onMenuToggle;
        
        // Check if button already exists
        if (document.getElementById(this.buttonId)) {
            return;
        }

        const floatButton = document.createElement('div');
        floatButton.id = this.buttonId;
        floatButton.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
          <circle cx="7" cy="9" r="1" fill="currentColor"/>
          <circle cx="12" cy="9" r="1" fill="currentColor"/>
          <circle cx="17" cy="9" r="1" fill="currentColor"/>
        </svg>
      `;

        // Style the floating button
        Object.assign(floatButton.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transition: 'all 0.3s ease',
            zIndex: '10000',
            fontFamily: 'system-ui, -apple-system, sans-serif'
        });

        // Add hover effects
        floatButton.addEventListener('mouseenter', () => {
            floatButton.style.transform = 'scale(1.1)';
            floatButton.style.backgroundColor = '#3730a3';
        });

        floatButton.addEventListener('mouseleave', () => {
            floatButton.style.transform = 'scale(1)';
            floatButton.style.backgroundColor = '#4f46e5';
        });

        // Add click handler to show menu
        floatButton.addEventListener('click', this.toggleMenu.bind(this));

        // Add tooltip
        floatButton.title = 'Open ArXiv Chatbot Menu';

        // Inject into page
        document.body.appendChild(floatButton);
    }

    // Function to toggle the menu
    toggleMenu() {
        if (this.onMenuToggle) {
            this.onMenuToggle();
        }
    }

    // Check if button exists
    exists() {
        return document.getElementById(this.buttonId) !== null;
    }

    // Remove button
    remove() {
        const button = document.getElementById(this.buttonId);
        if (button) {
            button.remove();
        }
    }
}
