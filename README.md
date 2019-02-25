# ducks-to-db
Node.js application to store Papa Duck events in a Postgres database.
## Prerequisites
1. [Node.js and npm](https://nodejs.org/en/download/)

## Running
Firstly, create a `.env` file in the root directory of the project with the following environment variables configured. See the [IBM Cloud Postgres](https://console.bluemix.net/docs/services/databases-for-postgresql/connecting-external.html#connecting-external-app) documentation and the [IBM Cloud Watson IoT](https://console.bluemix.net/docs/services/IoT/platform_authorization.html#connecting-applications) documentation for details on how to obtain the requried credentials.
```
PG_USER=<postgres user name>
PG_PASSWORD=<postgres password>
PG_HOST=<postgres host>
PG_DATABASE=<postgres database name>
PG_TABLE_NAME=<table to insert papa-duck data>
PG_CERT_BASE_64=<base64 encoded postgres root certificate>
WIOT_ORG=<Watson IoT Organisation ID>
WIOT_APP_KEY=<Watson IoT API Key>
WIOT_TOKEN=<Watson IoT Application Token>
WIOT_DOMAIN=<URL of the Watson IoT instance, normally internetofthings.ibmcloud.com>
WIOT_DEVICE_TYPE=<device type to listen for events from. i.e. papa-duck>
```
Then, install the dependencies and start the application:
```
npm install
npm start
```

Publishing device events to the IBM Watson IoT platform for the device type specified in the `WIOT_DEVICE_TYPE` environment variable will result in a SQL INSERT query into the database table specified in `PG_TABLE_NAME`.
