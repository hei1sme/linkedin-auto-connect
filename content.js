console.log("LinkedIn Auto Connect content script loaded");

let autoConnectEnabled = false;
let dashboardContainer = null;
const MY_NETWORK_URLS = ['https://www.linkedin.com/mynetwork/', 'https://www.linkedin.com/mynetwork/grow/'];

function isOnMyNetworkPage() {
  return MY_NETWORK_URLS.some(url => window.location.href.startsWith(url));
}

// Add support for :contains selector
HTMLElement.prototype.contains = function(text) {
  return this.textContent.includes(text);
};

function createDashboard() {
  console.log("Creating dashboard");
  dashboardContainer = document.createElement('div');
  dashboardContainer.className = 'linkedin-auto-connect-dashboard';
  dashboardContainer.innerHTML = `
    <div class="dashboard-header">
      <h2>Auto Connect</h2>
      <div class="status-indicator ${autoConnectEnabled ? 'active' : ''}"></div>
    </div>
    <div class="dashboard-content">
      <div class="stats">
        <span id="connectCount">0</span> connections sent
      </div>
      <label class="switch">
        <input type="checkbox" id="autoConnectToggle" ${autoConnectEnabled ? 'checked' : ''}>
        <span class="slider round"></span>
      </label>
      <button id="goToNetwork" class="network-btn">
        Go to My Network
      </button>
    </div>
  `;
  document.body.appendChild(dashboardContainer);

  // Add event listeners
  const toggleButton = dashboardContainer.querySelector('#autoConnectToggle');
  const networkButton = dashboardContainer.querySelector('#goToNetwork');

  toggleButton.addEventListener('change', (e) => {
    autoConnectEnabled = e.target.checked;
    console.log(`Auto-connect ${autoConnectEnabled ? 'enabled' : 'disabled'}`);
    updateDashboardStatus();
    chrome.storage.sync.set({ autoConnectEnabled });
    
    if (autoConnectEnabled) {
      if (isOnMyNetworkPage()) {
        console.log("Starting auto-connect");
        startAutoConnect();
      } else {
        console.log("Redirecting to My Network page");
        window.location.href = MY_NETWORK_URLS[0];
      }
    }
  });

  networkButton.addEventListener('click', () => {
    console.log("Go to My Network button clicked");
    window.location.href = MY_NETWORK_URLS[0];
  });
}

function updateDashboardStatus() {
  console.log("Updating dashboard status");
  const statusIndicator = dashboardContainer.querySelector('.status-indicator');
  statusIndicator.className = `status-indicator ${autoConnectEnabled ? 'active' : ''}`;
}

function startAutoConnect() {
    console.log("startAutoConnect function called");
    console.log("Current URL:", window.location.href);
    console.log("Auto-connect enabled:", autoConnectEnabled);
    
    if (!autoConnectEnabled || !isOnMyNetworkPage()) {
      console.log("Auto-connect not enabled or not on My Network page");
      return;
    }
  
    console.log("Searching for connect buttons");
    const connectButtons = Array.from(document.querySelectorAll('button')).filter(button => {
      return button.textContent.trim() === 'Connect';
    });
    
    console.log(`Found ${connectButtons.length} connect buttons`);
    let connectCount = 0;
  
    connectButtons.forEach((button) => {
      console.log("Clicking connect button");
      button.click();
      connectCount++;
      
      setTimeout(() => {
        const sendButton = document.querySelector('button.artdeco-button--primary[aria-label="Send now"]');
        if (sendButton) {
          console.log("Clicking send button");
          sendButton.click();
        } else {
          console.log("Send button not found");
        }
      }, 1000);
    });
  
    console.log(`Sent ${connectCount} connection requests`);
  
    // Update the connection count in the dashboard
    const countElement = dashboardContainer.querySelector('#connectCount');
    if (countElement) {
      const currentCount = parseInt(countElement.textContent) || 0;
      countElement.textContent = currentCount + connectCount;
    }
  
    // Scroll to load more connections
    console.log("Scrolling to load more connections");
    window.scrollTo(0, document.body.scrollHeight);
  
    console.log("Scheduling next auto-connect cycle");
    setTimeout(startAutoConnect, 5000);
  }

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request);
  if (request.action === 'toggleAutoConnect') {
    autoConnectEnabled = request.enabled;
    console.log(`Auto-connect ${autoConnectEnabled ? 'enabled' : 'disabled'} via message`);
    updateDashboardStatus();
    
    if (autoConnectEnabled && !isOnMyNetworkPage()) {
      console.log("Redirecting to My Network page");
      window.location.href = MY_NETWORK_URLS[0];
    } else if (autoConnectEnabled) {
      console.log("Starting auto-connect");
      startAutoConnect();
    }
  }
});

// Initialize the dashboard
chrome.storage.sync.get('autoConnectEnabled', (data) => {
  console.log("Initializing dashboard");
  autoConnectEnabled = data.autoConnectEnabled || false;
  console.log("Auto-connect enabled:", autoConnectEnabled);
  createDashboard();
  
  if (autoConnectEnabled && isOnMyNetworkPage()) {
    console.log("Auto-connect enabled and on My Network page, starting auto-connect");
    startAutoConnect();
  }
});

// Ensure dashboard is created even if storage retrieval fails
setTimeout(() => {
  if (!dashboardContainer) {
    console.log("Dashboard not created, creating now");
    createDashboard();
  }
}, 2000);

