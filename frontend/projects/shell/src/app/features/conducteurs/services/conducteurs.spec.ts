

import { beforeEach, describe, expect, it } from 'vitest';
import { ConducteursService } from './conducteurs';
import { TestBed } from '@angular/core/testing';


describe('ConducteursService', () => {
  let service: ConducteursService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConducteursService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
