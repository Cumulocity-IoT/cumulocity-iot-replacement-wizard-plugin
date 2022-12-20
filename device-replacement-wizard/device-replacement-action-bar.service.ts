import { Injectable, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IManagedObject } from '@c8y/client';
import { ActionBarItem, ExtensionFactory } from '@c8y/ngx-components';
import { DeviceReplacementActionBarButtonComponent } from './device-replacement-action-bar-button/device-replacement-action-bar-button.component';

@Injectable()
export class DeviceReplacementActionBarService implements ExtensionFactory<ActionBarItem> {
  private deviceRegex = new RegExp(/\/device\/\d+/);
  context: IManagedObject;

  constructor(private router: Router, private injector: Injector) {}

  get(activatedRoute?: ActivatedRoute): ActionBarItem | ActionBarItem[] {
    if (this.deviceRegex.test(this.router.url)) {
      const { contextData } = activatedRoute.parent.snapshot.data;
      this.context = contextData;
      const action: ActionBarItem = {
        placement: 'more',
        component: DeviceReplacementActionBarButtonComponent,
        priority: 0,
        injector: this.injector
      };
      return action;
    }
    return [];
  }
}
