import { AfterViewInit, Component, ViewChild } from '@angular/core';
import {
  AuditRecordType,
  AuditService,
  EventService,
  IdentityService,
  IExternalIdentity,
  IManagedObject,
  InventoryService,
  UserService
} from '@c8y/client';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AlertService, AppStateService, C8yStepper, ModalService } from '@c8y/ngx-components';
import { DeviceGridComponent } from '@c8y/ngx-components/device-grid';
import { DeviceReplacementActionBarService } from '../device-replacement-action-bar.service';

@Component({
  selector: 'c8y-device-replacement-wizard',
  templateUrl: './device-replacement-wizard.component.html'
})
export class DeviceReplacementWizardComponent implements AfterViewInit {
  @ViewChild(DeviceGridComponent, { static: false })
  dataGrid: DeviceGridComponent;
  @ViewChild(C8yStepper, { static: true })
  stepper: C8yStepper;
  deviceToBeReplaced: IManagedObject;
  replacementDevice: IManagedObject;
  loading = false;

  constructor(
    private modal: BsModalRef,
    private inventory: InventoryService,
    private alertService: AlertService,
    private modalService: ModalService,
    private identity: IdentityService,
    private audit: AuditService,
    private event: EventService,
    private user: UserService,
    private factory: DeviceReplacementActionBarService,
    private appState: AppStateService
  ) {
    this.deviceToBeReplaced = this.factory.context;
  }

  ngAfterViewInit(): void {
    this.dataGrid.actionControls = [
      {
        type: 'asd',
        callback: item => {
          this.deviceSelected(item as IManagedObject);
        },
        icon: 'replace',
        text: 'Use as replacement'
      }
    ];

    this.dataGrid.baseQuery = {
      __not: {
        softwareType: {
          __eq: this.deviceToBeReplaced.owner
        }
      }
    };
  }

  async deviceSelected(device: IManagedObject) {
    if (await this.isValidDevice(device)) {
      try {
        await this.modalService.confirm(
          'Replacement',
          `Are you sure that you want to replace the data from the current device with the one selected?`,
          'warning'
        );
      } catch {
        return;
      }
      this.replacementDevice = device;
      try {
        await this.replaceDevice(this.deviceToBeReplaced, this.replacementDevice);
      } catch (e) {
        if (e instanceof Error) {
          this.alertService.warning(e.message);
          return;
        }
        this.alertService.warning(`Failed.`, e);
        return;
      }
      this.stepper.next();
    } else {
      this.alertService.info(
        `This device is currently not supported, because it has child assets.`
      );
    }
  }

  continue() {
    this.stepper.next();
  }

  cancel() {
    this.close();
  }

  close() {
    this.modal.hide();
  }

  private async isValidDevice(device: IManagedObject) {
    const { owner } = device;
    const { data } = await this.inventory.list({ query: `'owner' eq '${owner}'` });
    return data.length === 1;
  }

  private async replaceDevice(oldDevice: IManagedObject, replacement: IManagedObject) {
    const { data: oldExternalIds } = await this.identity.list(oldDevice.id);
    const { data: newExternalIds } = await this.identity.list(replacement.id);

    const oldExternalId = this.findExternalSerial(oldExternalIds);
    const newExternalId = this.findExternalSerial(newExternalIds);

    if (!oldExternalId || !newExternalId) {
      throw new Error('External Ids missing.');
    }

    if (!oldDevice.owner.startsWith('device_')) {
      throw new Error('Old device is not owned by a device user.');
    }

    await this.identity.delete(newExternalId);
    await this.identity.create({
      type: 'c8y_Serial',
      externalId: newExternalId.externalId,
      managedObject: { id: oldDevice.id }
    });
    await this.identity.delete(oldExternalId);
    await this.inventory.delete(newExternalId.managedObject.id);
    const date = new Date().toISOString();
    await this.inventory.update({
      id: oldDevice.id,
      owner: replacement.owner,
      lastReplacement: {
        time: date,
        previousExternalID: oldExternalId.externalId,
        user: this.appState.currentUser.value.id
      }
    });
    await this.user.delete(oldDevice.owner);
    await this.event.create({
      c8y_device_replacement: {},
      source: { id: oldDevice.id },
      text: `Device ${oldExternalId.externalId} was replaced with ${newExternalId.externalId}`,
      time: date,
      type: 'c8y_device_replacement'
    });
    await this.audit.create({
      activity: 'Device war replaced',
      application: 'devicemanagement',
      source: { id: oldDevice.id },
      text: `Device ${oldExternalId.externalId} was replaced with ${newExternalId.externalId}`,
      time: date,
      type: AuditRecordType.INVENTORY
    });
  }

  private findExternalSerial(ids: IExternalIdentity[]): IExternalIdentity {
    return ids.find(tmp => tmp.type === 'c8y_Serial');
  }
}
