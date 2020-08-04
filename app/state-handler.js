function State() {
    this._handlers = {};
    this._values = {};
}

State.prototype.init = function(states) {
    this._values = states;
    for (var v in this._values) {
        this[v] = this._values[v];
    }
    return this;
}
State.prototype.setState =  function(name, value) {
    this._values[name] = value;
    this[name] = this._values[name];
    console.log("-> call event handler:", this._values[name]);
    if (this._handlers[name] && this._handlers[name].length) {
        this._handlers[name].forEach(handler => {
            console.log(" - call:", handler);
            handler(this._values[name]);
        });
    }
}
State.prototype.reload = function() {
    if (arguments.length == 0) {
        for (var name in this._handlers) {
            this._handlers[name].forEach(handler => handler(this._values[name]));
        }
        return this._values;
    } else {
        var values = {};
        for (var name in arguments) {
            if (this._handlers[name]) this._handlers[name].forEach(handler => handler(this._values[name]));
            values[name] = this._values[name];
        }
        return values;
    }
}
State.prototype.getAll = function() {
    return this._values;
}
State.prototype.bindStateChangeEventListener = function(name, handler) {
    if (typeof(handler) != "function") throw new Error("handler must be a function");
    if (!this._handlers[name]) this._handlers[name] = []; 
    this._handlers[name].push(handler);
}
State.prototype.unBindStateChangeListener = function(name, handler) {
    if (!this._handlers[name]) return;
    var index = this._handlers[name].indexOf(handler);
    if (index != -1) {
        this._handlers[name].splice(index, 1);
    }
}
State.prototype.watch = function(name, node, events, getter) {
    node.addEventListener(events, function() {
        if (getter && typeof(getter) === "function") var value = getter(node);
        else {
            switch(node.tagName) {
                case "INPUT": //text, number, checkbox
                    break;
                case "BUTTON":
                case "A":
                    break;
                default:    
            }
        }
        thiz.setState(name, value);
    });
}
