import { NgModule } from '@angular/core';
import { CoreModule, HOOK_ACTION_BAR } from '@c8y/ngx-components';
import { ColumnUtilService, DeviceGridModule, DeviceGridService } from '@c8y/ngx-components/device-grid';
import { DeviceReplacementActionBarButtonComponent } from './device-replacement-action-bar-button/device-replacement-action-bar-button.component';
import { DeviceReplacementActionBarService } from './device-replacement-action-bar.service';
import { DeviceReplacementWizardComponent } from './device-replacement-wizard/device-replacement-wizard.component';

@NgModule({
  imports: [
    CoreModule, DeviceGridModule
  ],
  declarations: [DeviceReplacementActionBarButtonComponent, DeviceReplacementWizardComponent],
  providers: [
    DeviceGridService,
    DeviceReplacementActionBarService,
    {
      provide: HOOK_ACTION_BAR,
      useExisting: DeviceReplacementActionBarService,
      multi: true
    }
  ]
})
export class DeviceReplacementWizardModule { }
