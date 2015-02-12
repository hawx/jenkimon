function once(fn) {
  var result;

  return function() {
    if (result === void 0) { result = fn(); } 
    return result;
  }
}

var __slice = Array.prototype.slice;

function leftVariadic(fn) {
  var fnLength = fn.length;

  if (fnLength < 1) { 
    return fn; 
  } else if (fnLength === 1) {
    return function() {
      return fn.call(this, __slice.call(arguments, 0));
    }
  } else {
    return function() {
      var left = __slice.call(arguments, 0, arguments.length - fnLength + 1),
          right = __slice.call(arguments, arguments.length - fnLength + 1);

      return fn.apply(this, [left].concat(right));
    }
  }
}