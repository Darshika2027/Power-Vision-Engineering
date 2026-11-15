import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductBarcodeLookup } from './product-barcode-lookup';

describe('ProductBarcodeLookup', () => {
  let component: ProductBarcodeLookup;
  let fixture: ComponentFixture<ProductBarcodeLookup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductBarcodeLookup],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductBarcodeLookup);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
