import { TestBed } from '@angular/core/testing';

import { ServiceVehicules } from './service-vehicules';

describe('ServiceVehicules', () => {
  let service: ServiceVehicules;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceVehicules);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
