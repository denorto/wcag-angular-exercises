import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalAccessible } from './modal-accessible';

describe('ModalAccessible', () => {
  let component: ModalAccessible;
  let fixture: ComponentFixture<ModalAccessible>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalAccessible]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModalAccessible);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
