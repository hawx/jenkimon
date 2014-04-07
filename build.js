function getUrlVars() {
    var vars = [];
    var pairs = window.location.search.slice(window.location.href.indexOf('?') + 1).split('&');

    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i].split('=');
        vars.push(decodeURIComponent(pair[0]));
        vars[pair[0]] = pair[1];
    }

    return vars;
}

var Job = function(values) {
    var _values = values, li, timeText, bar;

    return {
        draw: function() {
            li = document.createElement("li");
            li.className = this.status();

            var h1 = document.createElement("h1");
            h1.appendChild(document.createTextNode(_values.name));

            var time = document.createElement("time");
            timeText = document.createTextNode(this.verb() + " " + this.time());
            time.appendChild(timeText);

            li.appendChild(h1);
            li.appendChild(time);

            bar = document.createElement("div");
            bar.classList.add("bar");
            bar.setAttribute("style", "width: " + this.percentage() + "%;");

            li.appendChild(bar);
            return li;
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

            li.className = this.status();
            timeText.textContent = this.verb() + " " + this.time();
            bar.setAttribute("style", "width: " + this.percentage() + "%;");
        }
    };
};

var Jobs = function(el) {
    var ul = $(el).html("");
    var _jobs = {};

    return {
        update: function(values) {
            if (_jobs[values.name] === void 0) {
                _jobs[values.name] = new Job(values);
                ul.append(_jobs[values.name].draw());
            } else {
                _jobs[values.name].update(values);
            }
        }
    };
};

$(function() {
    var jobs = new Jobs('ul');

    var vars = getUrlVars(),
        baseUrl = vars["server"],
        theme = vars["theme"],
        filters = (vars["filters"] || "").toLowerCase().split(','),
        scope = vars["scope"] || "contains",
        showInactive = vars["showInactive"];

    var nameMatcher = (scope == "contains")
        ? function (name, filter) { return name.indexOf(filter) !== -1; }
        : function (name, filter) { return name.indexOf(filter) === 0; };

    if (theme == "neon") { $('body').addClass('neon'); }
    if (showInactive)    { $('body').addClass('show-inactive'); }

    function getAllJobs() {
        var url = baseUrl + "/api/json?depth=2&tree=jobs[name,color,downstreamProjects[name],upstreamProjects[name],lastBuild[number,builtOn,duration,estimatedDuration,timestamp,result,actions[causes[shortDescription,upstreamProject,upstreamBuild],lastBuiltRevision[branch[name]]],changeSet[items[msg,author[fullName],date]]]]";

        $.ajax({
            url: url,
            timeout: 5000
        }).done(function(data) {
            for (var i = 0; i < data.jobs.length; i++) {
                var job = data.jobs[i];

                if (filters.length > 0 && !filters.some(function (filter) { return nameMatcher(job.name.toLowerCase(), filter); })) {
                    continue;
                }

                if (job.lastBuild == null) { continue; }

                jobs.update({
                    name: job.name,
                    colour: job.color,
                    startedAt: job.lastBuild.timestamp,
                    estimatedDuration: job.lastBuild.estimatedDuration
                });
            }
        }).fail(function() {
            console.log("Error contacting the build server");
        });
    }

    window.setInterval(getAllJobs, 5000);
    getAllJobs();
});
