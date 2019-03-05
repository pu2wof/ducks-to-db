# API Documentation
The API enables the management of duck devices, communicating with both the IBM Watson IoT Platform and the Postgres database.

## Contents
1. [Create a Device](#create-a-device)
2. [Generate an Arduino File](#generate-an-arduino-file)
3. [Get Device Types](#get-device-types)
4. [Get Device Details](#get-device-details)
5. [Delete a Device](#delete-a-device)

## Create a Device
Create a new device in the IBM Watson IoT Platform, store the device in the Postgres database and receieve the device credentials. A *.ino* file string is also returned, containing papa-duck arduino code with the credentials in place. Note. This pulls the latest code from the [github repository](https://github.com/Project-Owl/duck/blob/master/ClusterDuck/papa.ino) to perform the replace. If the device type does not exist, it is created and if the device already exists, the existing credentials are returned.  

**HTTP POST** `/api/devices` with the following URL query parameters:
* `type`: The device type to be used (e.g. 'papa-duck')
* `id`: The unique identifier of the device (e.g. a MAC address)

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
