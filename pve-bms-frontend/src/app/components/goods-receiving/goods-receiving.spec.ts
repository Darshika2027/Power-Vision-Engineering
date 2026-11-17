import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';

import { GoodsReceiving } from './goods-receiving';

describe('GoodsReceiving', () => {
  let component: GoodsReceiving;
  let fixture: ComponentFixture<GoodsReceiving>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoodsReceiving],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    httpMock = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(GoodsReceiving);
    component = fixture.componentInstance;

    fixture.detectChanges();

    const request = httpMock.expectOne(
      'http://localhost:8080/api/products'
    );

    request.flush([]);

    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});