import { TestBed } from '@angular/core/testing';

import { Evenements } from './evenements';

describe('Evenements', () => {
  let service: Evenements;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Evenements);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
