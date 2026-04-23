import { TestBed } from '@angular/core/testing';

import { ServiceDashboard } from './service-dashboard';

describe('ServiceDashboard', () => {
  let service: ServiceDashboard;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceDashboard);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
