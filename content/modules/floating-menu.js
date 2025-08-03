// Floating Menu Module
// Handles the creation and management of the floating menu

window.ArxivChatbot = window.ArxivChatbot || {};
window.ArxivChatbot.FloatingMenu = class {
    constructor() {
        this.menuId = 'arxiv-chatbot-menu';
        this.onMenuAction = null;
    }

    // Function to create the floating menu
    create(onMenuAction) {
        this.onMenuAction = onMenuAction;
        
        const menu = document.createElement('div');
        menu.id = this.menuId;
        
        menu.innerHTML = `
            <div class="menu-option" data-action="chat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM20 16H5.17L4 17.17V4H20V16Z" fill="currentColor"/>
                    <circle cx="7" cy="9" r="1" fill="currentColor"/>
                    <circle cx="12" cy="9" r="1" fill="currentColor"/>
                    <circle cx="17" cy="9" r="1" fill="currentColor"/>
                </svg>
                <span>Chat</span>
            </div>
            <div class="menu-option" data-action="resume">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="currentColor"/>
                </svg>
                <span>Resume</span>
                <span class="wip-badge">WIP</span>
            </div>
            <div class="menu-option" data-action="podcast">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" fill="currentColor"/>
                </svg>
                <span>Podcast</span>
            </div>
        `;
        
        // Style the menu
        Object.assign(menu.style, {
            position: 'fixed',
            bottom: '90px',
            right: '20px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            zIndex: '10001',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            minWidth: '160px',
            animation: 'menuSlideIn 0.2s ease-out'
        });
        
        // Add CSS animation for smooth appearance
        this.addMenuStyles();
        
        // Add event listeners to menu options
        menu.addEventListener('click', (e) => {
            const option = e.target.closest('.menu-option');
            if (option) {
                const action = option.dataset.action;
                if (this.onMenuAction) {
                    this.onMenuAction(action);
                }
                menu.remove(); // Close menu after selection
            }
        });
        
        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!menu.contains(e.target) && !document.getElementById('arxiv-chatbot-float-btn').contains(e.target)) {
                    menu.remove();
                }
            }, { once: true });
        }, 100);
        
        document.body.appendChild(menu);
    }

    // Function to toggle the menu
    toggle() {
        const existingMenu = document.getElementById(this.menuId);
        
        if (existingMenu) {
            // If menu exists, remove it
            existingMenu.remove();
        } else {
            // Create and show the menu
            this.create(this.onMenuAction);
        }
    }

    // Add CSS styles for the menu
    addMenuStyles() {
        // Check if styles already exist
        if (document.getElementById('floating-menu-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'floating-menu-styles';
        style.textContent = `
            @keyframes menuSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(10px) scale(0.95);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }
            
            #arxiv-chatbot-menu .menu-option {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 14px 16px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                color: #374151;
                position: relative;
            }
            
            #arxiv-chatbot-menu .menu-option:hover {
                background-color: #f3f4f6;
            }
            
            #arxiv-chatbot-menu .menu-option[data-action="resume"]:hover,
            #arxiv-chatbot-menu .menu-option[data-action="podcast"]:hover {
                background-color: #fef3c7;
            }
            
            #arxiv-chatbot-menu .menu-option span:first-of-type {
                font-weight: 500;
                flex: 1;
            }
            
            #arxiv-chatbot-menu .wip-badge {
                background-color: #fbbf24;
                color: #92400e;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            #arxiv-chatbot-menu .menu-option:not(:last-child) {
                border-bottom: 1px solid #f3f4f6;
            }
        `;
        document.head.appendChild(style);
    }

    // Check if menu exists
    exists() {
        return document.getElementById(this.menuId) !== null;
    }

    // Remove menu
    remove() {
        const menu = document.getElementById(this.menuId);
        if (menu) {
            menu.remove();
        }
    }
}
