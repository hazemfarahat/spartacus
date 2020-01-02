import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormGroup } from '@angular/forms';
import {
  CartService,
  OrderEntry,
  PromotionLocation,
  PromotionResult,
} from '@spartacus/core';
import { Observable } from 'rxjs';
import {
  ModalRef,
  ModalService,
} from '../../../../shared/components/modal/index';
import { PromotionService } from '../../../../shared/services/promotion/promotion.service';
import { AddedToCartDialogComponent } from '../../add-to-cart/added-to-cart-dialog/added-to-cart-dialog.component';

export interface Item {
  product?: any;
  quantity?: any;
  basePrice?: any;
  totalPrice?: any;
  updateable?: boolean;
}

@Component({
  selector: 'cx-cart-item',
  templateUrl: './cart-item.component.html',
})
export class CartItemComponent implements OnInit {
  @Input()
  compact = false;
  @Input()
  item: Item;
  @Input()
  isReadOnly = false;
  @Input()
  cartIsLoading = false;
  @Input()
  allowBuyAgain = false;

  @Input()
  promotionLocation: PromotionLocation = PromotionLocation.ActiveCart;

  @Input()
  potentialProductPromotions: any[];

  @Output()
  remove = new EventEmitter<any>();
  @Output()
  update = new EventEmitter<any>();
  @Output()
  view = new EventEmitter<any>();

  @Input()
  parent: FormGroup;

  appliedProductPromotions$: Observable<PromotionResult[]>;
  cartEntry$: Observable<OrderEntry>;

  modalRef: ModalRef;
  increment: boolean;

  constructor(
    promotionService: PromotionService,
    // tslint:disable-next-line: unified-signatures
    cartService: CartService,
    modalService: ModalService
  );

  /**
   * @deprecated
   */
  constructor(promotionService: PromotionService);

  constructor(
    protected promotionService: PromotionService,
    protected cartService?: CartService,
    protected modalService?: ModalService
  ) {}

  ngOnInit() {
    this.appliedProductPromotions$ = this.promotionService.getProductPromotionForEntry(
      this.item,
      this.promotionLocation
    );
    this.cartEntry$ = this.cartService.getEntry(this.item.product.code);
    this.increment = false;
  }

  isProductOutOfStock(product) {
    // TODO Move stocklevelstatuses across the app to an enum
    return (
      product &&
      product.stock &&
      product.stock.stockLevelStatus === 'outOfStock'
    );
  }

  addToCart() {
    if (!this.item.product.code) {
      return;
    }
    // check item is already present in the cart
    // so modal will have proper header text displayed
    this.cartService
      .getEntry(this.item.product.code)
      .subscribe(entry => {
        if (entry) {
          this.increment = true;
        }
        this.openModal();
        this.cartService.addEntry(this.item.product.code, 1);
        this.increment = false;
      })
      .unsubscribe();
  }

  private openModal(): void {
    let modalInstance: any;

    this.modalRef = this.modalService.open(AddedToCartDialogComponent, {
      centered: true,
      size: 'lg',
    });

    modalInstance = this.modalRef.componentInstance;
    modalInstance.entry$ = this.cartEntry$;
    modalInstance.cart$ = this.cartService.getActive();
    modalInstance.loaded$ = this.cartService.getLoaded();
    modalInstance.quantity = 1;
    modalInstance.increment = this.increment;
  }

  updateItem(updatedQuantity: number) {
    this.update.emit({ item: this.item, updatedQuantity });
  }

  removeItem() {
    this.remove.emit(this.item);
  }

  viewItem() {
    this.view.emit();
  }
}
