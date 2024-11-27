import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetailGridInformationComponent } from './detail-grid-information.component';

describe('DetailGridInformationComponent', () => {
  let component: DetailGridInformationComponent;
  let fixture: ComponentFixture<DetailGridInformationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DetailGridInformationComponent]
    });
    fixture = TestBed.createComponent(DetailGridInformationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
