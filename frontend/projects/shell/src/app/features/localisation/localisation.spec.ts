import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Localisation } from './localisation';

describe('Localisation', () => {
  let component: Localisation;
  let fixture: ComponentFixture<Localisation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Localisation],
    }).compileComponents();

    fixture = TestBed.createComponent(Localisation);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
