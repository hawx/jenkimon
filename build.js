var Observable = function() {
  this.subscribers = {};
}

Observable.prototype.on = function(ev, f) {
  if (this.subscribers[ev] == void 0) {
    this.subscribers[ev] = [];
  }
  this.subscribers[ev].push(f);
  return this;
}

Observable.prototype.fire = function(ev, data) {
  var found = this.subscribers[ev];
  if (found != void 0) {
    for (var i = 0; i < found.length; i++) {
      found[i](data);
    }
  }
  return this;
}

function getUrlVars() {
  var vars = [];
  var pairs = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

  for (var i = 0; i < pairs.length; i++) {
    var pair = pairs[i].split('=');
    vars.push(decodeURIComponent(pair[0]));
    vars[pair[0]] = pair[1];
  }

  return vars;
}

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

var Job = function(values) {
  var _values = values, view = new JobView();

  return {
    init: function(parent) {
      view.init(parent, this, _values);
    },
    status: function() {
      switch (_values.colour) {
      case "blue":          return "not-building";
      case "red":           return "failed";
      case "red_anime":     return "was-failed in-progress";
      case "blue_anime":    return "was-built in-progress";
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

      return "finished";
    },
    update: function(values) {
      _values = values;
      view.refresh(this);
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
        _jobs[values.name] = new Job(values);
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
    var url = _baseUrl + "/api/json?depth=2&tree=jobs[name,color,downstreamProjects[name],upstreamProjects[name],lastBuild[number,builtOn,duration,estimatedDuration,timestamp,result,actions[causes[shortDescription,upstreamProject,upstreamBuild],lastBuiltRevision[branch[name]]],changeSet[items[msg,author[fullName],date]]]]";
    $.ajax({
      url: url,
      timeout: 5000
    }).done(function(data) { 
      observable.fire('update', data); 
    }).fail(function() {
      observable.fire('disconnected');
    });
  };
  
  this.color = function() {
    var verbs = {};
    for (var job in _jobs) {
      var v = _jobs[job].verb();
      if (!verbs[v]) { verbs[v] = 0; }
      verbs[v] += 1;
    }

    if (verbs['failed'] > 0) return 'red';
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
    var box = $('#box').hide();

    jobs.on('green', function() {
      var i = "<img style=\"height: 100%; width: 100%\" src=\"http://thecatapi.com/api/images/get.php?format=src&amp;type=gif&t=" + new Date().getTime() + "\">";
      box.show();
      box.html(i);
    }).on('anime', function() {
      box.hide();
    }).on('red', function() {
      box.hide();
    });
  },
  porkour: function(jobs) {
    var box = $('#box').hide();

    jobs.on('green', function() {
      var i = "<img style=\"height: 100%; width: 100%\" src=\"http://i.imgur.com/pIxorOD.gif\">";
      box.show();
      box.html(i);
    }).on('anime', function() {
      box.hide();
    }).on('red', function() {
      box.hide();
    });
  },
  green: function(jobs) {
    jobs.on('green', function() {
      $('body').css({background: 'green'});
    }).on('anime', function() {
      $('body').css({background: 'black'});
    }).on('red', function() {
      $('body').css({background: 'black'});
    });
  },
  guid: function(jobs) {
    jobs.on('green', function() {
      $('#box').show();
      $('#box').html("<h1 style=\"margin-top: 25%; text-align: center; font-size: 3em;\">" + Math.uuid() + "</h1>");
    }).on('anime', function() {
      $('#box').hide();
    }).on('red', function() {
      $('#box').hide();
    });
  }
}

var audioz = {
  classic: function(jobs) {
    var green = new Audio('audioz/classic/fixed.mp3');
    var red = new Audio('audioz/classic/failed.mp3');
    var anime = new Audio('audioz/classic/new.mp3');

    jobs.on('green', function() {
      green.play();
    }).on('anime', function() {
      anime.play();
    }).on('red', function() {
      red.play();
    });
  }
}

$(function() {
  var vars = getUrlVars(),
      baseUrl = vars["server"],
      theme = vars["theme"],
      filters = (vars["filters"] || "").toLowerCase().split(','),
      scope = vars["scope"] || "contains",
      showInactive = vars["showInactive"],
      bonusName = vars["bonusRound"],
      audiozName = vars['audioz'];

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

  if (audiozName != void 0 && audioz[audiozName] != void 0) {
    audioz[audiozName](jobs);
  }

  $(document).on('click', function() { 
    jobs.reset();
    jobs.poll();
  });

  jobs.on('disconnected', function() {
    console.log("Error contacting the build server");
  });

  window.setInterval(function() { jobs.poll(); }, 5000);
  jobs.poll();
});
