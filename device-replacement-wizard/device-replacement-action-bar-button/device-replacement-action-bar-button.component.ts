import { Component } from '@angular/core';
import { BsModalService } from 'ngx-bootstrap/modal';
import { DeviceReplacementWizardComponent } from '../device-replacement-wizard/device-replacement-wizard.component';

@Component({
  selector: 'li[device-replacement-action-bar-button]',
  templateUrl: './device-replacement-action-bar-button.component.html'
})
export class DeviceReplacementActionBarButtonComponent {
  constructor(private modalService: BsModalService) {}

  openWizard() {
    this.modalService.show(DeviceReplacementWizardComponent, {
      class: 'modal-lg',
      ariaDescribedby: 'modal-body',
      ariaLabelledBy: 'modal-title'
    });
  }
}
