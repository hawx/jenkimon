window.location.parameters = once(function() {
  var vars = [];
  var pairs = window.location.search.slice(1).split('&');

  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    vars.push(decodeURIComponent(pair[0]));
    vars[pair[0]] = pair[1];
  }

  return vars;
})();

var JobView = function() {
  var li, bar, timeText;

  return {
    init: function(parent, job, values) {
      li = document.createElement("li");
      li.className = job.status();

      var h1 = document.createElement("h1");
      h1.appendChild(document.createTextNode(values.name));

      var time = document.createElement("time");
      timeText = document.createTextNode(job.verb() + " " + job.time());
      time.appendChild(timeText);

      li.appendChild(h1);
      li.appendChild(time);

      bar = document.createElement("div");
      bar.classList.add("bar");
      bar.setAttribute("style", "width: " + job.percentage() + "%;");

      li.appendChild(bar);
      parent.append(li);
    },
    refresh: function(job) {
      li.className = job.status();
      timeText.textContent = job.verb() + " " + job.time();
      bar.setAttribute("style", "width: " + job.percentage() + "%;");
    }
  }
}

var Job = function(values, observable) {
  var _values = values, _observable = observable, view = new JobView();

  return {
    init: function(parent) {
      view.init(parent, this, _values);
    },
    status: function() {
      switch (_values.colour) {
      case "blue":          return "not-building";
      case "red":           return "failed";
      case "aborted":       return "aborted";
      case "blue_anime":    return "was-built in-progress";
      case "red_anime":     return "was-failed in-progress";
      case "aborted_anime": return "was-aborted in-progress";
      default:              return "no-change";
      }
    },
    percentage: function() {
      var duration = Date.now() - _values.startedAt;
      var percentage = Math.round((duration / _values.estimatedDuration) * 100);

      return percentage > 100 ? 100 : percentage;
    },
    time: function() {
      return moment.unix(_values.startedAt / 1000).fromNow();
    },
    verb: function() {
      if (this.status().indexOf("in-progress") != -1)
        return "started";

      if (this.status() == "failed")
        return "failed";

      if (this.status() == "aborted")
        return "aborted";

      return "finished";
    },
    update: function(values) {
      view.refresh(this);

      var transition = function(oldColour, newColour) {
        if (oldColour === undefined)
          return "new";

        if (newColour == "blue") {
          if (oldColour == "blue_anime")
            return "successful";

          return "fixed"; 
        }

        if (newColour == "red") {
          if (oldColour == "blue_anime")
            return "failed";

          return "repeatedlyFailing";
        }

        if (newColour == "aborted" && oldColour != "aborted") {
          return "aborted";
        }

        if (newColour.match(/_anime$/) && !oldColour.match(/_anime$/))
          return "started";

        return "noChange";
      }(_values.color, values.color);

      _values = values;
      observable.fire('job_' + transition);
    }
  };
};

var Jobs = function(el, baseUrl, ignore) {
  var ul = $(el).html("");
  var _jobs = {};
  var lastColor = null;
  var _baseUrl = baseUrl;
  var _ignore = ignore;
  var observable = new Observable();

  observable.on('update', function(data) {
    for (var i = 0; i < data.jobs.length; i++) {
      var job = data.jobs[i];

      if (_ignore(job.name)) { continue; }
      if (job.lastBuild == null) { continue; }

      var values = {
        name: job.name,
        colour: job.color,
        startedAt: job.lastBuild.timestamp,
        estimatedDuration: job.lastBuild.estimatedDuration
      };

      if (_jobs[values.name] === void 0) {
        _jobs[values.name] = new Job(values, observable);
        _jobs[values.name].init(ul);
      } else {
        _jobs[values.name].update(values);
      }
    }

    var c = this.color();
    if (c != lastColor) {
      lastColor = c;
      observable.fire(c);
    }
  }.bind(this));

  // Events: (update(data), disconnected, red, anime, green)
  this.on = observable.on.bind(observable);

  this.poll = function() {
    var url = _baseUrl + "/api/json?depth=2&tree=jobs[name,color,lastBuild[number,builtOn,duration,estimatedDuration,timestamp,result]]";
    $.ajax({
      url: url,
      timeout: 5000
    }).done(function(data) { 
      observable.fire('connected');
      observable.fire('update', data); 
    }).fail(function(err) {
      observable.fire('disconnected', err);
    });
  };
  
  this.color = function() {
    var verbs = {};
    for (var job in _jobs) {
      var v = _jobs[job].verb();
      if (!verbs[v]) { verbs[v] = 0; }
      verbs[v] += 1;
    }

    if (verbs['failed'] > 0 || verbs['aborted'] > 0) return 'red';
    if (verbs['started'] > 0) return 'anime';
    return 'green';
  };
  
  this.reset = function () {
    lastColor = null;
  }

  this.observable = observable;
};

var bonusRound = {
  cat: function(jobs) {
    jobs.on('green', function() {
      imageShow("http://thecatapi.com/api/images/get.php?format=src&amp;type=gif&t=" + new Date().getTime());
    }).on('anime', 'red', function() {
      imageHide();
    });
  },
  porkour: function(jobs) {
    jobs.on('green', function() {
      imageShow("http://i.imgur.com/pIxorOD.gif")
    }).on('anime', 'red', function() {
      imageHide();
    });
  },
  green: function(jobs) {
    jobs.on('green', function() {
      $('body').css({background: 'green'});
    }).on('anime', 'red', function() {
      $('body').css({background: 'black'});
    });
  },
  guid: function(jobs) {
    var box = $('#box').hide();

    jobs.on('green', function() {
      $('#box').show();
      $('#box').html("<h1 style=\"margin-top: 25%; text-align: center; font-size: 3em;\">" + Math.uuid() + "</h1>");
    }).on('anime', 'red', function() {
      $('#box').hide();
    });
  }
}

var audioList = {
  classic: function(jobs) {
    var play = function(path) {
      var _audio;
      return function() { 
        if (_audio === void 0) {
          _audio = new Audio(path);
        }
        _audio.play(); 
      }
    }

    jobs.on('job_fixed', play('audioz/classic/fixed.mp3'))
        .on('job_failed', play('audioz/classic/failed.mp3'))
        .on('job_repeatedlyFailing', play('audioz/classic/repeatedlyFailing.mp3'));
  }
}

function imageShow(url) {
  $('body').css({
      "background-image": 'url("' + url + '")',
  });
}

function imageHide() {
  $('body').css({"background-image": ""});
}

var start = (function() {
  var vars = window.location.parameters,
      baseUrl = vars["server"],
      theme = vars["theme"],
      filters = (vars["filters"] || "").toLowerCase().split(','),
      scope = vars["scope"] || "contains",
      showInactive = vars["showInactive"],
      bonusName = vars["bonusRound"],
      audioName = vars['audio'];

  var nameMatcher = (scope == "contains")
    ? function (name, filter) { return name.indexOf(filter) !== -1; }
    : function (name, filter) { return name.indexOf(filter) === 0; };

  var ignore = function(name) {
    return filters.length > 0 && !filters.some(function (filter) { return nameMatcher(name.toLowerCase(), filter); })
  };

  var jobs = new Jobs('ul', baseUrl, ignore);

  if (theme == "neon") { $('body').addClass('neon'); }
  if (showInactive)  { $('body').addClass('show-inactive'); }

  if (bonusName != void 0 && bonusRound[bonusName] != void 0) {
    bonusRound[bonusName](jobs);
  }

  if (audioName != void 0 && audioList[audioName] != void 0) {
    audioList[audioName](jobs);
  }

  $(document).on('click', function() { 
    jobs.reset();
    jobs.poll();
  });

  var isConnected = true;

  jobs.on('disconnected', function(err) {
    console.log("Error contacting the build server", err);
    imageShow("http://i.stack.imgur.com/jiFfM.jpg");
    isConnected = false;
  }).on('connected', function() {
    if (!isConnected) {
      imageHide();
      isConnected = true;
    }
  });

  // window.setInterval(function() { jobs.poll(); }, 5000);
  jobs.poll();

  return jobs;
});

// $(start);
