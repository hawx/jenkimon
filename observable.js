var Observable = function() {
  this.subscribers = {};
}

Observable.prototype.on = leftVariadic(function(evs, f) {
  for (var i = 0; i < evs.length; i++) {
    var ev = evs[i];
    if (this.subscribers[ev] == void 0) {
      this.subscribers[ev] = [];
    }
    this.subscribers[ev].push(f);
  }
  return this;
});

Observable.prototype.fire = function(ev, data) {
  var found = this.subscribers[ev];
  if (found != void 0) {
    for (var i = 0; i < found.length; i++) {
      found[i](data);
    }
  }
  return this;
}
