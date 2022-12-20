# Content

- [Content](#content)
- [Overview](#overview)
- [Requirements](#requirements)
- [Installation](#installation)
- [Steps](#steps)
- [Limitations](#limitations)
- [Copyright](#copyright)

# Overview

The replacement wizard allows exchanging a physical device and keep the virtual representation on platform side with the full history. Therefore the user, which needs to be admin, is guides through several steps in order to  replace the device with a new one and keep the history of measurements, events, alarms etc. .
In the current implementation no child device support is given since some implementation do derive their external id of their parent device.

# Requirements

Devices with proper registration implementation need to be availabe within the platform. Additionally:

- Both devices (new and old) needs to be registered to platform and be able to send data
- Devices should be turned off during the replacement process
- Device implementation relays on c8y_Serial as identifier

# Installation

You need to install the plugin for the device management application to your Cumulocity IoT Tenant:


The plugin is provided as binaries in [Releases](https://github.com/SoftwareAG/cumulocity-iot-replacement-wizard-plugin/releases).

To install the plugin go to the Adminstration App -> Ecosystem -> Packages and click on "Add Application" on the top right.

> **_NOTE:_** If you don't see the Packages Menu you have to add "?beta=true" in your URL.
> Example: {{url}}/apps/administration?beta=true

Select the binaries and wait until it is uploaded.

> **_NOTE:_** We need to clone the Device Management app to add the plugin to it

After succesful upload go to "All Applications" and click on "Add Application". Select "Duplicate existing application"
and afterwards "Device Manegement".

![](resources/Duplicate-app.png)

Now select the cloned Device Management App and go to the "Plugin" Tab. Click on "Install Plugin" and select "replacment wizard plugin"

![](resources/Plugin-installed.png)

# Steps

In order to replace a physical device and keep the history several steps and RestAPI calls are required.

```mermaid
sequenceDiagram
    actor Bob
    participant Service Technician
    participant UI(Wizard)
    participant C8Y Backend
    Bob ->> Service Technician: Pick device to exchange
    Service Technician ->> UI(Wizard): more -> replace device
    UI(Wizard) -->> Service Technician: Wizard modal opens
    Service Technician ->> UI(Wizard): confirm dialog
    UI(Wizard) ->> C8Y Backend: Request all devices
    C8Y Backend -->> UI(Wizard): Response
    UI(Wizard) -->> Service Technician: Data grid will all devices
    Service Technician ->> UI(Wizard): Pick new device
    UI(Wizard) -->> Service Technician: Confirm dialog
    Service Technician ->> UI(Wizard): Confirm
    UI(Wizard) ->> C8Y Backend: Change device owner of managed object of old device
    C8Y Backend -->> UI(Wizard): Response
    UI(Wizard) ->> C8Y Backend: Change device externalId of managed object of old device to new externalId
    C8Y Backend -->> UI(Wizard): Response
    UI(Wizard) ->> C8Y Backend: Delete managed object of new device
    C8Y Backend -->> UI(Wizard): Response
    UI(Wizard) ->> C8Y Backend: Delete device user
    C8Y Backend -->> UI(Wizard): Response
    UI(Wizard) ->> C8Y Backend: Create audit entry
    C8Y Backend -->> UI(Wizard): Response
    UI(Wizard) ->> C8Y Backend: Create event
    C8Y Backend -->> UI(Wizard): Response
    UI(Wizard) ->> C8Y Backend: Update managed object of device
    C8Y Backend -->> UI(Wizard): Response
    UI(Wizard) -->> Service Technician: Completion dialog

```
<br>


1. User picks old device object in C8Y with e.g. owner: device_1234, externalID: 1234
   
   This can be done for example while adding the wizard to the more section within the device management, such that the old device object is picked via the device list.

     ![](resources/Old-device.png)

2. User confirms the text dialog with all explanations about edge cases.
   

>Welcome to the Replacement Wizard!
>We will guide you through the process of the replacing a device without losing the history and the device information. Before starting the replacement process both devices, the old and the new one, must be turned on and connected to Cumulocity. The wizard will then ask you to select the new device to which you want the data to be transferred.
>Now you can turn off both devices again in order to avoid any inconsistencies during the process.
>Be aware: Devices with child assets are currently not supported. The replacement is not supported if the device owner is used for multiple devices.

![](resources/Welcome.png)

3. User picks new device object in C8Y with e.g. owner:device_9876, externalID: 9876

>Click Next once you have chosen the device.
>Pop-up: Are you sure that you want to replace the data from the current device with the one selected?
>Pop-up: This device is currently not supported, because it has child assets.

![](resources/New-device.png)

The user has to confirm that he is really sure about that.

![](resources/Confirmation-dialog.png)


1. ExternalID of new device object in C8Y of type c8y_Serial will be deleted
  
     The externalID of the new device will be removed since the later delete request is asynchron. Otherwise it can not be guaranted that the new physical device send data to the old managed object.

     ```shell
     DELETE /identity/externalIds/c8y_Serial/{device_name_new}
     ```

2. ExternalID of old device object in C8Y of type c8y_Serial will be deleted

     The externalID of the old device will be removed to prevent getting data from the old physical device.

     ```shell
     DELETE /identity/externalIds/c8y_Serial/{device_name_old}
     ```

3. ExternalID of old device object in C8Y of type c8y_Serial will be created with externalID of new physical device. ExternalID is now e.g. 9876.

     New physical device now points to the old managed object via the identifier c8y_Serial.

     ```shell
     POST /identity/globalIds/59720399/externalIds
     ```
     with

      ```json
    {
    "externalId": "9876",
     "type": "c8y_Serial"
    } 
     ```
     

7. Owner of old device object in C8Y will be changed to new device user. Owner is now device_9876.
   
     Device owner is the only user that is allowed to send data to a device. Thus the new device user needs to be owner of the managed object.

     ```shell
     PUT /inventory/managedObjects/{internalID_old_device}
     ```

     with 

     ```json
    {
    "id": "{internalID}",
    "owner": "device_9876"
    } 
     ```

8. New device object in C8Y will be deleted
   
     The new device is not needed anymore. However data that was send to the platform between connecting the new device and completly replacing the device will be lost and not migrated.

     ```shell
     DELETE /inventory/managedObjects/{internalID_new_device}
     ```

9. Old device user (devic_1234) will be deleted

     In order to prevent the old device to send data and the device will be re-created the device user of the old device is deleted. However a check is applied that the user is really just a device user and not a user.

     ```shell
     DELETE /user/{tenantid}/users/device_1234 
     ```
  
10. Completion dialog
    
>The replacement was successfully completed! Please turn the device on now.
>The replaced device was disconnected from the platform. If you want to use it again for another purpose, please register the device via the device management.
>Depending on your use case it might be necessary to factory reset your device. 

![](resources/Confirmation.png)

Additionally for documentation purposes the following will be done:

- Audit entry will be created
     ```json
     {"activity": "Device war replaced",
      "application": "devicemanagement",
      "source": {
        "id": "externalID_old",
      },
      "text": "Device {externalID_old} was replaced with {externalID_new}",
      "time": "2022-11-22T12:54:27.234Z",
      "type": "Inventory",
      "user": "murat.bayram@softwareag.com"
      }
     ```
     ![](resources/Audit.png)


- Event will be created
     ```json
     {
      "c8y_device_replacement": {},
      "source": {
        "id": "externalID_old"
      },
      "text": "Device {externalID_old} was replaced with {externalID_new}",
      "time": "2022-12-13T10:55:29.000Z",
      "type": "c8y_device_replacement"
    }
     ```
     ![](resources/Event.png)

- Managed object will be updated with fragment about latest replacement
     ```json
     {
     "lastReplacement": {"time": "2022-12-13T10:55:29.000Z", "previousExternalID": "abc", "user": "murat.bayram@softwareag.com"}   
     }
     ```
     ![](resources/MO-update.png)

# Limitations

1. No child device support currently

Since in some cases child devices could be implemented that way that they derive their externalId from their parent device it is hard to detect that since any pattern can be used. However thats the reason why in that stage child devices are not supported yet. A banner will indicate that the device that wants to be replaced contains child devices.

![](resources/Child-devices.png)

This might change in the future and would require that all child devices need to be manually checked within the wizard as well.

2. No support if one device owner has multiple devices

Since the device user is deleted in order to prevent the old device to re-create itself on platorm side. However in some case customers might share device users for multiple devices although this is not recommended. However to prevent bricking devices the wizard does perform the replacement as soon as it detects that the same device user is used for more than one device.
It is also checked whether the owner is a device user and not a standard user.

![](resources/Device-user.png)


These logic could also be used as a security check for proper implementation.



# Copyright

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




