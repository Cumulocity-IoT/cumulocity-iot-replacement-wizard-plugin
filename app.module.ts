import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule as ngRouterModule } from '@angular/router';
import { BootstrapComponent, CoreModule, RouterModule } from '@c8y/ngx-components';
import { DeviceReplacementWizardModule } from './device-replacement-wizard/device-replacement-wizard.module';
import { BsModalRef } from 'ngx-bootstrap/modal';

@NgModule({
  imports: [
    BrowserAnimationsModule,
    ngRouterModule.forRoot([], { enableTracing: false, useHash: true }),
    RouterModule.forRoot(),
    CoreModule.forRoot(),
    DeviceReplacementWizardModule
  ],
  providers: [BsModalRef],
  bootstrap: [BootstrapComponent]
})
export class AppModule {}
