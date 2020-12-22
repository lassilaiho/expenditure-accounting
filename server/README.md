# expenditure-accounting server

This is the expenditure-accounting API server. It requires a PostgreSQL
database.

## Building 

Run tests with

    go test ./...

Tests require access to Docker to create a temporary PostgreSQL instance for the
test run.

Build the server by running

    go build -o server

The server requires a command line parameter `-config <CONFIG_FILE>`. The
configuration file is a JSON file with the following options:

| Option | Type | Default value | Description |
| ------ | ---- | ------------- | ----------- |
| port               | int           | 8080 | port to listen to |
| bcryptCost         | int           | 14 | cost of bcrypt algorithm used to hash passwords |
| sessionTimeout     | duration string | 1h | client session timeout |
| refreshTime        | duration string | 15m | the amount of time sessionTimeout is postponed when client communicates with server |
| rootURL            | string        | /api | The root URL of the API server |
| allowedOrigins     | array of strings      | empty array | origins allowed in CORS headers |
| dbConnectionString | string        | | connection string to connect to database |

If an option doesn't have a default value, it is required in the configuration
file. Duration strings are parsed as [Go duration
values](https://golang.org/pkg/time/#ParseDuration).
