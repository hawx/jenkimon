$(function() {
    var baseUrl = window.location.hash.substring(1);

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
          var list = $('ul');
          list.html("");

          console.log(data.jobs.length);

          for (var i = 0; i < data.jobs.length; i++) {
            var job = data.jobs[i];

            if (job.lastBuild == null) {
              continue;
            }

            var time = moment.unix(job.lastBuild.timestamp / 1000);
            var status = colorToStatus(job.color);

            if (status == "failed") {
              list.append("<li class=\""+status+"\"><h1>"+job.name+"</h1><time>failed "+time.fromNow()+"</time></li>");
            } else if (status == "in-progress") {
              list.append("<li class=\"job-"+i+"\" class=\""+status+"\">" +
                          "<h1>"+job.name+"</h1>" +
                          "<time>started "+time.fromNow()+"</time>" +
                          "<div class=\"bar\"></div>" +
                          "</li>");

              console.log(job);

              var durationTime =  Date.now() - job.lastBuild.timestamp;
              var estimatedDuration = job.lastBuild.estimatedDuration;

              var percentage = Math.round((durationTime / estimatedDuration) * 100);

              if (percentage > 100) { percentage = 100; }

              $('li.job-' + i + ' .bar').css({'width': percentage + '%'});
            } else {
              list.append("<li class=\""+status+"\"><h1>"+job.name+"</h1><time>finished "+time.fromNow()+"</time></li>");
            }
          }
        }).fail(function() {
            console.log("error contacting build server");
        });
    }

    setInterval(getAllJobs, 5000);
    getAllJobs();
});
