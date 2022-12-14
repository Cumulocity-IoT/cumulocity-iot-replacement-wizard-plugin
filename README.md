# Content

- [Overview](#overview)
- [Quickstart](#quickstart)

## Overview

The replacement wizard allows exchanging a physical device and replaces the virtual representation on platform side. Therefore the user, which needs to be admin, is guides through several steps in order to change replace the device with a new one and keep the history of measurements, events, alarms etc. .
In the current implementation no child device support is given since some implementation do derive their external id of their parent device.


## Requirements

- Both devices (new and old) needs to be registered to platform and be able to send data
- Devices should be turned off during the replacement process

## Steps

<p align="center">
<img src="resources/sequence_uml.drawio.png"  style="width: 70%;" />
</p>
<br/>

- User picks old device object in C8Y with e.g. owner: device_1234, externalID: 1234
- User picks new device object in C8Y with e.g. owner:device_9876, externalID: 9876
- ExternalID of new device object in C8Y of type c8y_Serial will be deleted
- ExternalID of old device object in C8Y of type c8y_Serial will be deleted
- ExternalID of old device object in C8Y of type c8y_Serial will be created with externalID of new physical device. ExternalID is now e.g. 9876
- Owner of old device object in C8Y will be changed to new deviceuser. Owner is now device_9876
- New device object in C8Y will be deleted
- Old deviceuser (devic_1234) will be deleted (checking if really a device user before deleting)
  
Additionally for documentation purposes the following will be done:

- Audit entry will be created
     ```json
     {"activity": "Device war replaced",
      "application": "devicemanagement",
      "source": {
        "id": "OLDDEVICEID",
      },
      "text": "Device xyz was replaced with abc",
      "time": "2022-11-22T12:54:27.234Z",
      "type": "Inventory",
      "user": "murat.bayram@softwareag.com"
      }
     ```
- Event will be created
     ```json
     {
      "c8y_device_replacement": {},
      "source": {
        "id": "OLDDEVICEID"
      },
      "text": "Device xyz was replaced with device abc",
      "time": "2022-12-13T10:55:29.000Z",
      "type": "c8y_device_replacement"
    }
     ```
- Managed object will be updated with fragment about latest replacement
     ```json
     {
     "lastReplacement": {"time": "2022-12-13T10:55:29.000Z", "previousExternalID": "abc", "user": "murat.bayram@softwareag.com"}   
     }
     ```

### Limitations

- No child device support currently
- No support if one device owner has multiple devices


### Copyright Header

Each file that contains code from yourself should contain a copyright header in the following format:
````
Copyright (c) 2022 Software AG, Darmstadt, Germany and/or Software AG USA Inc., Reston, VA, USA,
and/or its subsidiaries and/or its affiliates and/or their licensors.

SPDX-License-Identifier: Apache-2.0

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

````


These tools are provided as-is and without warranty or support. They do not constitute part of the Software AG product suite. Users are free to use, fork and modify them, subject to the license agreement. While Software AG welcomes contributions, we cannot guarantee to include every contribution in the master project.

For more information you can Ask a Question in the [TECH Community Forums](https://tech.forums.softwareag.com/tag/Cumulocity-IoT).

Contact us at [TECHcommunity](mailto:Communities@softwareag.com?subject=Github/SoftwareAG) if you have any questions.




