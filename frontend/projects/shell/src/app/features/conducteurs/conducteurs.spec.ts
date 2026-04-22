import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Conducteurs } from './conducteurs';

describe('Conducteurs', () => {
  let component: Conducteurs;
  let fixture: ComponentFixture<Conducteurs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Conducteurs],
    }).compileComponents();

    fixture = TestBed.createComponent(Conducteurs);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
