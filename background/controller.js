function Controller() {
    this.tabList = {};
    this.library = Data.Library;
};

Controller.prototype._getDomain = function(url) {
    var result, match;
    if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {
        result = match[1]
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
            result = match[1]
        }
    }
    return result
};

Controller.prototype._activeTab = function(tab) {
    this.tabList.forEach(id => {
        this.tabList[id].active = (tab.id == id);
    });
};

Controller.prototype.onTabActive = function(tab) {
    // this.tabList.find(p => new RegEx(p).test(tab.url));
    if (this.tabList[tab.id]) {
        this._activeTab(tab);
    } else {
        this.tabList[tab.id] = {
            id: tab.id,
            domain: this._getDomain(tab.url),
            url: tab.url,
            favIconUrl: tab.favIconUrl
        };
        console.log("# append tabList", this.tabList);
        this._activeTab(tab);
    }
};

Controller.prototype.onTabChange = function(tab) {

};

Controller.prototype.handleHeaderData = function(data, callback) {
    var thiz = this;
    if (!data.tabId || !data.responseHeaders || !data.responseHeaders.length || data.type != "media") return;
    var f = data.responseHeaders.find(i => i.name.toUpperCase() == "CONTENT-TYPE");
    // console.log(".", data.responseHeaders, f);
    if (f && Data.ContentTypes.MEDIA.includes(f.value)) {
        // console.log("# RequestHeader Data:", data);
        var tabInfo = chrome.tabs.get(data.tabId, function(tab) {
            var song = {
                requestId: data.requestId,
                tabId: data.tabId,
                url: data.url,
                title: tab.title,
                initiator: data.initiator,
                "content-type": f.value
            };
            if (callback) callback({newSong: song});
        });
    }
};
