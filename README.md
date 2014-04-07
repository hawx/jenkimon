# jenkimon

Either download and open `/path/to/index.html?server=http://myjenkins`, or visit
<http://hawx.github.io/jenkimon?server=http://myjenkins> where the value of
`?server=` is set to the url (including protocol) of the root of your jenkins
install.

## Options

Name           | Description
---------------|------------------------------------------------------------------------
`server`       | Path to jenkins including protocol
`theme`        | Choose a different theme from: neon.
`filters`      | Comma separated list of words to filter displayed jobs by
`scope`        | Set to "startsWith" to filter by matching the left side of the job name
`showInactive` | Set to anything to show inactive jobs
