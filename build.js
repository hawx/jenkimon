function get(n) {
    var half = location.search.split(n + "=")[1];
    return half ? decodeURIComponent(half.split("&")[0]) : null;
}

function percentFinished(startedAt, estimatedDuration) {
    var duration = Date.now() - startedAt;
    var percentage = Math.round((duration / estimatedDuration) * 100);

    return percentage > 100 ? 100 : percentage;
}

function getStatus(colour) {
    switch (colour) {
    case "blue":
        return "not-building";
    case "red":
        return "failed";
    case "red_anime":
        return "was-failed in-progress";
    case "blue_anime":
        return "was-built in-progress";
    default:
        return "no-change";
    }
}

function getVerb(status) {
    if (status.indexOf("in-progress") != -1)
        return "started";

    if (status == "failed")
        return "failed";

    return "finished";
}

var Job = function(opts) {
    var status = getStatus(opts.colour);

    var li = document.createElement("li");
    li.className = status;

    var h1 = document.createElement("h1");
    h1.appendChild(document.createTextNode(opts.name));

    var time = document.createElement("time");
    var timeText = document.createTextNode(getVerb(status) + " " + opts.fromNow);
    time.appendChild(timeText);

    li.appendChild(h1);
    li.appendChild(time);

    var bar = document.createElement("div");
    bar.classList.add("bar");
    bar.setAttribute("style", "width: " + opts.percentage + "%;");

    li.appendChild(bar);

    return {
        draw: function() {
            return li;
        },
        update: function(values) {
            var status = getStatus(values.colour);
            li.className = status;

            timeText.textContent = getVerb(status) + " " + values.fromNow;

            bar.setAttribute("style", "width: " + values.percentage + "%;");
        }
    }
}

var Jobs = function(el) {
    var ul = $(el);
    ul.html("");

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
    }
}

$(function() {
    var jobs = new Jobs('ul');
    var baseUrl = get("url");

    function getAllJobs() {
        var url = baseUrl + "/api/json?depth=2&tree=jobs[name,color,downstreamProjects[name],upstreamProjects[name],lastBuild[number,builtOn,duration,estimatedDuration,timestamp,result,actions[causes[shortDescription,upstreamProject,upstreamBuild],lastBuiltRevision[branch[name]]],changeSet[items[msg,author[fullName],date]]]]";

        $.ajax({
            url: url,
            timeout: 5000
        }).done(function(data) {
            for (var i = 0; i < data.jobs.length; i++) {
                var job = data.jobs[i];

                if (job.lastBuild == null) { continue; }

                var time = moment.unix(job.lastBuild.timestamp / 1000);
                var percentage = percentFinished(job.lastBuild.timestamp, job.lastBuild.estimatedDuration);

                jobs.update({name: job.name, status: status, fromNow: time.fromNow(), percentage: percentage});
            }
        }).fail(function() {
            console.log("Error contacting the build server");
        });
    }

    setInterval(getAllJobs, 5000);
    getAllJobs();
});
