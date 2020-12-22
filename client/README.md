# expenditure-accounting client

This is the expenditure-accounting client. It is a single-page web app that can
be deployed as a set of static files. The client depends on the API server.

## Building

Install dependencies with

    yarn install

Tests can be run with

    yarn test

Development server can be started with

    yarn start

It expects the API server to be listening at http://localhost:8080/api.

Production app to can be built with

    yarn build

The output is written to `build` directory.

The production build requires two environment variables:
- PUBLIC_URL: The URL where the app will be hosted
- REACT_APP_API_URL: The URL of the API server
