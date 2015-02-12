var http = (function() {
  var request = function(method, url, data) {
    return new Promise(function(resolve, reject) {
      var sendingData = (data !== void 0);

      var r = new XMLHttpRequest();
      r.open(method, url);
      r.setRequestHeader('Accept', 'application/json');
      if (sendingData) {
        r.setRequestHeader('Content-Type', 'application/json');
      }

      r.onload = function() {
        if (r.status >= 200 && r.status < 300) {
          resolve(JSON.parse(r.response));
        } else {
          reject(Error(r.statusText));
        }
      };

      r.onerror = function() {
        reject(Error("Network error"));
      };

      if (sendingData) {
        r.send(JSON.stringify(data));
      } else {
        r.send();
      }
    });
  };

  return {
    get: function(url) {
      return request('GET', url);
    }
  };
})();