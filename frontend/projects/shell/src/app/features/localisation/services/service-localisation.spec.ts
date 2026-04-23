import { TestBed } from '@angular/core/testing';

import { ServiceLocalisation } from './service-localisation';

describe('ServiceLocalisation', () => {
  let service: ServiceLocalisation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceLocalisation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
