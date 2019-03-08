# API Documentation
The API enables the management of duck devices, communicating with both the IBM Watson IoT Platform and the Postgres database.

## Contents
1. [Create a Device](#create-a-device)
2. [Generate an Arduino File](#generate-an-arduino-file)
3. [Get Device Types](#get-device-types)
4. [Get Device Details](#get-device-details)
5. [Delete a Device](#delete-a-device)
6. [Observe a Device Location](#observe-a-device-location)
7. [Get Latest Device Observation](#get-latest-device-observation)
8. [Trace Device Observations](#trace-device-observations)
9. [Check Message Status](#check-message-status)

## Create a Device
Create a new device in the IBM Watson IoT Platform, store the device in the Postgres database and receieve the device credentials. A *.ino* file string is also returned, containing papa-duck arduino code with the credentials in place. Note. This pulls the latest code from the [github repository](https://github.com/Project-Owl/duck/blob/master/ClusterDuck/papa.ino) to perform the replace. If the device type does not exist, it is created and if the device already exists, the existing credentials are returned.  

**HTTP POST** `/api/devices` with the following JSON body:
```
{
    "type": <The device type to be used (e.g. 'papa-duck')>,
    "id": <The unique identifier of the device (e.g. a MAC address)>
}
```

This request requires the `Content-Type: application/json` header.

Example Response:
```
{
    "file": "...",
    "credentials": {
        "organization": "zoad0c",
        "type": "papa-duck",
        "id": "new-papa-filew",
        "token": "..."
    }
}
```

## Generate an Arduino File
This generates a `papa-duck` *.ino* file with device credentials in place, ready for deployment to an ardunio. This uses the latest code from the [github repository](https://github.com/Project-Owl/duck/blob/master/ClusterDuck/papa.ino).

**HTTP GET** `/api/devices/file` with the following URL query parameters:
* `type`: The device type to be used (e.g. 'papa-duck')
* `id`: The unique identifier of the device (e.g. a MAC address)

Example Response: *.ino* file contents.

## Get Device Types
Get a list of device types currently stored within the IBM Watson IoT Platform.  

**HTTP GET** `/api/devices`  

Example Response:
```
{
  "results": [
    {
      "id": "android",
      "classId": "Device",
      "createdDateTime": "2019-03-04T14:48:32.473Z",
      "updatedDateTime": "2019-03-04T14:48:32.473Z",
      "refs": {
        "mappings": "api/v0002/device/types/android/mappings",
        "physicalInterface": "api/v0002/device/types/android/physicalinterface",
        "logicalInterfaces": "api/v0002/device/types/android/logicalinterfaces"
      }
    },
    {
      "id": "papa-duck",
      "classId": "Device",
      "createdDateTime": "2019-03-04T14:26:35.951Z",
      "updatedDateTime": "2019-03-04T14:26:35.951Z",
      "refs": {
        "mappings": "api/v0002/device/types/papa-duck/mappings",
        "physicalInterface": "api/v0002/device/types/papa-duck/physicalinterface",
        "logicalInterfaces": "api/v0002/device/types/papa-duck/logicalinterfaces"
      }
    }
  ],
  "meta": {
    "total_rows": 2
  }
}
```

## Get Device Details
Get all devices for a particular type.

**HTTP GET** `/api/devices/device` with the following URL query parameters:

* `type`: The device type to be used (e.g. 'papa-duck')

Example Response:
```
{
  "results": [
    {
      "clientId": "d:zoad0c:papa-duck:puerto-rico-papa-duck",
      "typeId": "papa-duck",
      "deviceId": "puerto-rico-papa-duck",
      "deviceInfo": {
        
      },
      "metadata": {
        
      },
      "registration": {
        "auth": {
          "id": "dancunnington@uk.ibm.com",
          "type": "person"
        },
        "date": "2019-03-04T14:26:36.181Z"
      },
      "groups": [
        
      ],
      "status": {
        "alert": {
          "enabled": false,
          "timestamp": "2019-03-04T14:26:36.181Z"
        }
      },
      "refs": {
        "diag": {
          "logs": "/api/v0002/device/types/papa-duck/devices/puerto-rico-papa-duck/diag/logs",
          "errorCodes": "/api/v0002/device/types/papa-duck/devices/puerto-rico-papa-duck/diag/errorCodes"
        },
        "location": "/api/v0002/device/types/papa-duck/devices/puerto-rico-papa-duck/location"
      }
    }
   ]
}
```

## Delete a Device
Delete a device from the IBM Watson IoT Platform as well as the Postgres database.

**HTTP DELETE** `/api/devices` with the following URL query parameters:
* `type`: The device type to be used (e.g. 'papa-duck')
* `id`: The unique identifier of the device (e.g. a MAC address)

Example Response:
```
{"ok": true}
```

## Observe a Device Location
Using a smartphone, observe the location of a device. The smartphone's GPS location is paired with the device ID (e.g. MAC Address). This can be sent via HTTP or MQTT, with the **MQTT event_type:** `duck-observation`.

**HTTP POST** `/api/devices/observation` with the following JSON body:
```
{
  "timestamp": <The timestamp of the device observation, (e.g. '2019-04-12 14:34')>,
  "device_type": <The device type to be used (e.g. 'papa-duck')>, 
  "device_id": <The device ID to be used (e.g. 'duck-1')>, 
  "latitude": <The latitude of the observation>, 
  "longitude": <The longitude of the observation>
}
```

This request requires the `Content-Type: application/json` header.

Example Response:
```
{"ok": true}
```

## Get Latest Device Observation
Retrieve the latest observation of a device. 
**HTTP GET** `/api/devices/latest_observation` with the following URL query parameters:

* `device_type`: The device type to be used (e.g. 'papa-duck')
* `device_id`: The device ID to be used (e.g. a MAC address)

Example Response:

```
{
    "observation_timestamp": "2019-04-12T18:34:00.000Z",
    "device_type": "papa-duck",
    "device_id": "dereks-duck",
    "latitude": "53.2324",
    "longitude": "-1.34343"
}
```

## Trace Device Observations
Retrieve all the observations of a device.
**HTTP GET** `/api/devices/trace_observations` with the following URL query parameters:

* `device_type`: The device type to be used (e.g. 'papa-duck')
* `device_id`: The device ID to be used (e.g. a MAC address)

Example Response:
```
[
    {
        "id": "2",
        "device_id": "dereks-duck",
        "device_type": "papa-duck",
        "latitude": "53.2324",
        "longitude": "-1.34343",
        "created_at": "2019-03-08T18:58:17.652Z",
        "updated_at": "2019-03-08T18:58:17.652Z",
        "observation_timestamp": "2019-04-12T16:34:00.000Z"
    },
    {
        "id": "3",
        "device_id": "dereks-duck",
        "device_type": "papa-duck",
        "latitude": "53.2324",
        "longitude": "-1.34343",
        "created_at": "2019-03-08T19:00:11.904Z",
        "updated_at": "2019-03-08T19:00:11.904Z",
        "observation_timestamp": "2019-04-12T16:34:00.000Z"
    }
]
```

## Check Message Status
Check if messages were received in the database via the ducklinks. 
**HTTP POST** `/api/devices/message_status` with the following JSON body:

```
{
  "message_ids": ["<Message UUID>",...]
}
```

Example Response, where a 1 indicates this Message UUID was receieved, and a 0 indicates this message was not received.

```
{
    "<Message UUID>": 1,
    "<Message UUID 2>": 0
}
```

