import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Evenements } from './evenements';

describe('Evenements', () => {
  let component: Evenements;
  let fixture: ComponentFixture<Evenements>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Evenements],
    }).compileComponents();

    fixture = TestBed.createComponent(Evenements);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
