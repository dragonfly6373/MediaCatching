
console.log("# background startup");

var c = new Controller();
var popup = null;

// Validate active tab is in my library:
chrome.tabs.onActivated.addListener((tab) => {
    if (!tab || !tab.id) return;
    chrome.tabs.get(parseInt(tab.id), c.onTabActive.bind(c));
});
chrome.browserAction.onClicked.addListener(function(tab) {
    if (popup != null) {
        chrome.windows.update(popup.id, {focused: true});
        return;
    }
    chrome.windows.create({
        url: chrome.runtime.getURL("./app/index.html"),
        type: "popup", width: 620, height: 350
    }, function(window) {
        console.log("#create: ", window);
        popup = window;
    });
});
// Catching RequestHeader Data:
chrome.webRequest.onHeadersReceived.addListener((data) => {
    function emitEvent(data) {
        chrome.runtime.sendMessage(data, null);
    }
    c.handleHeaderData.call(c, data, emitEvent);
}, {urls: ['<all_urls>']}, ['responseHeaders']);
// Response current tracking data to BrowserAction Popup:
chrome.runtime.onMessage.addListener(function(req, sender, sendResponse) {
    console.log("# Handle Request", req, sender);
    if (!req) {sendResponse(null); return;}
    switch (req.cmd) {
        case "data":
            switch(req.action) {
                case "pending_remove":
                    c.removePendingItem(req.data);
                    sendResponse({pendingList: c.getPendingList()});
                    break;
                default:
                    break;
            }
            break;
        case "control":
            break;
        default:
            sendResponse(null);
            break;
    }
});
