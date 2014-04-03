$(function() {
    var vars = getUrlVars(),
        baseUrl = vars["server"],
        filters = (vars["filters"] || "").toLowerCase().split(','),
        scope = vars["scope"] || "contains",
        showInactive = vars["showInactive"],
        list = $('ul');
    
    var nameMatcher = (scope == "contains")
        ? function (name, filter) { return name.indexOf(filter) !== -1; }
        : function (name, filter) { return name.indexOf(filter) === 0; };

    function colorToStatus(color) {
      if (color == "blue")
        return "not-building";

      if (color == "red")
        return "failed";

      if (color.match(/_anime$/))
        return "in-progress";

      return "no-change";
    }

    function getAllJobs() {
        var url = baseUrl + "/api/json?depth=2&tree=jobs[name,color,downstreamProjects[name],upstreamProjects[name],lastBuild[number,builtOn,duration,estimatedDuration,timestamp,result,actions[causes[shortDescription,upstreamProject,upstreamBuild],lastBuiltRevision[branch[name]]],changeSet[items[msg,author[fullName],date]]]]";

        $.ajax({
            url: url,
            timeout: 5000
      }).done(function(data) {
          list.empty();

          data.jobs.forEach(function (job) {
            if (!job.lastBuild) return;

            if (filters.length > 0 && !filters.some(function (filter) { return nameMatcher(job.name.toLowerCase(), filter); })) return;

            var time = moment.unix(job.lastBuild.timestamp / 1000);
            var status = colorToStatus(job.color);

            if (status == "failed") {
              list.append("<li class=\""+status+"\"><h1>"+job.name+"</h1><time>failed "+time.fromNow()+"</time></li>");
            } else if (status == "in-progress") {
              var item = $("<li class=\""+status+"\">" +
                          "<h1>"+job.name+"</h1>" +
                          "<time>started "+time.fromNow()+"</time>" +
                          "<div class=\"bar\"></div>" +
                         "</li>");
              list.append(item);

              var durationTime =  Date.now() - job.lastBuild.timestamp;
              var estimatedDuration = job.lastBuild.estimatedDuration;

             var percentage = Math.round((durationTime / estimatedDuration) * 100);

              if (percentage > 100) { percentage = 100; }

              item.children(".bar").css({'width': percentage + '%'});
            } else {
              var item = $("<li class=\""+status+"\"><h1>"+job.name+"</h1><time>finished "+time.fromNow()+"</time></li>");
              if (showInactive) item.css("display", "inherit");
              list.append(item);
            }
          });
        }).fail(function() {
            var list = $('ul');
            list.html("");
            list.append("<li class=\"failed\"><h1>Error contacting build server&hellip;</h1></li>");
        });
    }

    function getUrlVars()
    {
      var vars = [], hash;
      var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');

      for(var i = 0; i < hashes.length; i++)
      {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
      }

     return vars;
    }


    setInterval(getAllJobs, 5000);
    getAllJobs();
});
