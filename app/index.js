window.addEventListener('DOMContentLoaded', (event) => {
    var c = (function(doc) {
        function Controller() {
            var thiz = this;
            this.state = new State();
            this.player = doc.getElementById("player");
            this.btnSetting = doc.getElementById("btnSetting");
            this.btnCloseSettingPanel = doc.getElementById("btnCloseSettingPanel");
            this.settingPanel = doc.getElementById("settingPanel");
            this.pendingTable = doc.getElementById("pendingTable");
            this.playlistTable = doc.getElementById("playlistTable");
            this.playCount = doc.getElementById("playCount");
            this.btnPlay = doc.getElementById("btnPlay");
            this.btnNext = doc.getElementById("btnNext");
            this.btnTogglePlaylist = doc.getElementById("btnTogglePlaylist");
            this.trackBar = doc.getElementById("trackBar");
            this.progressBar = doc.getElementById("progressBar");
            this.songName = doc.getElementById("songName");
            this.timeLabel = doc.getElementById("timeLabel");

            this.state.bindStateChangeEventListener("active_setting_panel", (isActive) => thiz.toggleSetting.call(thiz, isActive));
            this.state.bindStateChangeEventListener("active_playlist", (isActive) => thiz.togglePlaylist.call(thiz, isActive));
            this.state.bindStateChangeEventListener("pendingList", (pendingList) => thiz._updatePendingList.call(thiz, pendingList, true));
            this.state.bindStateChangeEventListener("newSong", thiz._appendSong.bind(thiz));
            this.state.bindStateChangeEventListener("playlist", (playlist) => thiz._updatePlaylist.call(thiz, playlist, true));
            this.state.bindStateChangeEventListener("playerState", (state) => thiz._updatePlayerState.call(thiz, state, true));

            this.btnSetting.addEventListener("click", () => {thiz.setState("active_setting_panel", !thiz.state.active_setting_panel);});
            this.btnCloseSettingPanel.addEventListener("click", () => {thiz.setState("active_setting_panel", !thiz.state.active_setting_panel);});
            this.btnTogglePlaylist.addEventListener("click", () => {thiz.setState("active_playlist", !thiz.state.active_playlist);});
            this.trackBar.addEventListener("click", this.trackBarClick.bind(this));
            this.btnPlay.addEventListener("click", function() {
                chrome.runtime.sendMessage({cmd: "player", action: (thiz.state.playerState.paused ? "play" : "pause")}, thiz.updateState.bind(thiz));
            });
            this.btnNext.addEventListener("click", function() {
               chrome.runtime.sendMessage({cmd: "player", action: "next"}, thiz.updateState.bind(thiz));
            });
            this.pendingTable.addEventListener("click", function(event) {
                console.log("@click on", event.target);
                var node = event.target;
                if (!Dom.hasClass(node, "action-item")) return;
                var actionStr = Dom.getAttributeAsString(node, "action");
                if (!actionStr) return;
                var data = Dom.findUpwardForData(node, "data");
                console.log("@click", actionStr, data);
                switch(actionStr) {
                    case "add":
                        chrome.runtime.sendMessage({cmd: "data", action: "playlist_add", data: data}, thiz.updateState.bind(thiz));
                        break;
                    case "remove":
                        chrome.runtime.sendMessage({cmd: "data", action: "pending_remove", data: data}, thiz.updateState.bind(thiz));
                        break;
                    default: break;
                }
            });
            this.playlistTable.addEventListener("click", function(event) {
                console.log("@click on", event.target);
                var node = event.target;
                if (!Dom.hasClass(node, "action-item")) return;
                var actionStr = Dom.getAttributeAsString(node, "action");
                if (!actionStr) return;
                var data = Dom.findUpwardForData(node, "data");
                console.log("@click", actionStr, data);
                switch(actionStr) {
                    case "play":
                        chrome.runtime.sendMessage({cmd: "player", action: "playSong", data: data.requestId}, thiz.updateState.bind(thiz));
                        break;
                    case "remove":
                        chrome.runtime.sendMessage({cmd: "data", action: "playlist_remove", data: data}, thiz.updateState.bind(thiz));
                        break;
                    default: break;
                }
            });
            chrome.runtime.onMessage.addListener(function(data, sender, sendResponse) {
                console.log("# get message from:", sender, data);
                thiz.updateState(data);
            });
            // this.init();
        }
        Controller.prototype.init = function() {
            var thiz = this;
            this.requestState(state => {
                this.state.init(state);
                this.state.reload();
            });
            chrome.runtime.onPlayerStatusChange = function() {console.log("### onPlayerStatusChange");};
        };
        Controller.prototype.toTimeString = function(sec) {
            var str = "";
            if (sec > 3600) {
                str += Math.floor(sec / 3600) + ":";
            } else {
                var m = sec % 3600;
                str += Math.floor(m / 60) + ":" + Math.floor(m % 60);
            }
            return str;
        }
        Controller.prototype.trackBarHover = function() {
            var coorX = event.pageX;
            var tx = this.trackBar.offsetLeft;
            var w = coorX - tx;
            var sec = this.width2time(w);
            this.progressBar.setAttribute("time", this.toTimeString(sec));
        };
        Controller.prototype.trackBarClick = function(event) {
            var coorX = event.pageX;
            var tx = this.trackBar.offsetLeft;
            var w = coorX - tx;
            console.log("@click at", coorX, event.currentTarget.offsetLeft);
            this.progressBar.style.width = w + "px";
            this.progressBar.setAttribute("time", this.toTimeString(this.width2time(w)));
        };
        Controller.prototype.width2time = function(width) {
            var w = this.trackBar.offsetWidth;
            var d = this.state.playerState.duration;
            return (d * width / w);
        };
        Controller.prototype.time2width = function(sec) {
            var w = this.trackBar.offsetWidth;
            var d = this.state.playerState.duration;
            return (sec * w / d);
        };
        Controller.prototype._appendSong = function(song) {
            var pendingList = this.state.pendingList;
            if (pendingList.findIndex((item) => item.requestId == song.requestId) == -1) {
                pendingList.push(song);
                this.setState("pendingList", pendinglist);
            }
        };
        Controller.prototype._updatePendingList = function(pendingList, forceClear) {
            var thiz = this;
            if (forceClear) thiz.pendingTable.innerHTML = "";
            pendingList.forEach(function(item) {
                thiz.appendRow.call(thiz, thiz.pendingTable, false, item);
            });
        };
        Controller.prototype._updatePlaylist = function(playlist, forceClear) {
            var thiz = this;
            this.playCount.innerText = (playlist ? playlist.length : "" + 0);
            if (forceClear) thiz.playlistTable.innerHTML = "";
            playlist.forEach(function(item) {
                thiz.appendRow.call(thiz, thiz.playlistTable, true, item);
            });
        };
        Controller.prototype._updatePlayerState = function(playerState) {
            console.log("# update PlayerStates:", playerState);
            Dom.toggleClass(this.btnPlay, "paused", playerState.paused);
            var w = this.time2width(this.state.playerState.currentTime);
            this.progressBar.style.width = w + "px";
            this.songName.innerText = this.state.playlist.find((song) => (song.playing == true)).title;
            if (this.state.playerState.paused == false) {
                // this.interval.start()
            }
        };
        Controller.prototype.appendRow = function(parent, isPlaylist, data) {
            var node = Dom.newDOMElement({
                _name: "div",
                class: "vbox data-row" + (data.playing ? " playing" : ""),
                _children: [
                    {_name: "span", class: "title", _text: data.title},
                    {_name: "span", _text: data.initiator, title: data.initiator},
                    {
                        _name: "div", class: "action-box",
                        _children: [
                            {_name: "span", class: "action-item info", _text: (isPlaylist ? "play" : "add"), action: (isPlaylist ? "play" : "add")},
                            {_name: "span", class: "action-item danger", _text: "remove", action: "remove"}
                        ]
                    }
                ]
            });
            node.data = data;
            parent.appendChild(node);
        };
        Controller.prototype.requestState = function(callback) {
            chrome.runtime.sendMessage({cmd: "data", action: "get_state"}, function(res) {
                console.log(" # Current State:", res);
                this.state = res;
                if (callback) callback(res);
            });
        };
        Controller.prototype.toggleSetting = function(isActive) {
            Dom.toggleClass(this.settingPanel, "active", isActive || false);
        };
        Controller.prototype.togglePlaylist = function(isActive) {
            // console.log("# toggle playlist", isActive);
            Dom.toggleClass(this.playlistTable, "active", isActive || false);
            Dom.toggleClass(this.btnTogglePlaylist, "active", isActive || false);
        };
        Controller.prototype.updateState = function(newState) {
            for (prop in newState) {
                console.log("# update State", prop);
                this.setState(prop, newState[prop]);
            }
        };
        Controller.prototype.setState = function(name, value) {
            this.state.setState(name, value);
        }
        return new Controller();
    })(document);
});
