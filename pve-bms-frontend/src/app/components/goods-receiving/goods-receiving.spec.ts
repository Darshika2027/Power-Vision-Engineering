import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GoodsReceiving } from './goods-receiving';

describe('GoodsReceiving', () => {
  let component: GoodsReceiving;
  let fixture: ComponentFixture<GoodsReceiving>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoodsReceiving],
    }).compileComponents();

    fixture = TestBed.createComponent(GoodsReceiving);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
