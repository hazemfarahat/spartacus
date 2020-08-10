import { Injectable } from '@angular/core';
import { Actions, Effect, ofType } from '@ngrx/effects';
import { Observable, of } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { CartActions } from '../../../cart/store/actions/index';
import { makeErrorSerializable } from '../../../util/serialization-utils';
import { CheckoutReplenishmentOrderConnector } from '../../connectors/replenishment-order/replenishment-order.connector';
import { CheckoutActions } from '../actions/index';

@Injectable()
export class ReplenishmentOrderEffects {
  @Effect()
  scheduleReplenishmentOrder$: Observable<
    | CheckoutActions.ScheduleReplenishmentOrderSuccess
    | CheckoutActions.ScheduleReplenishmentOrderFail
    | CartActions.RemoveCart
  > = this.actions$.pipe(
    ofType(CheckoutActions.SCHEDULE_REPLENISHMENT_ORDER),
    map((action: CheckoutActions.ScheduleReplenishmentOrder) => action.payload),
    mergeMap((payload) => {
      return this.checkoutReplOrderConnector
        .scheduleReplenishmentOrder(
          payload.cartId,
          payload.scheduleReplenishmentForm,
          payload.termsChecked,
          payload.userId
        )
        .pipe(
          switchMap((data) => [
            new CartActions.RemoveCart({ cartId: payload.cartId }),
            new CheckoutActions.ScheduleReplenishmentOrderSuccess(data),
          ]),
          catchError((error) =>
            of(
              new CheckoutActions.ScheduleReplenishmentOrderFail(
                makeErrorSerializable(error)
              )
            )
          )
        );
    })
  );

  constructor(
    private actions$: Actions,
    private checkoutReplOrderConnector: CheckoutReplenishmentOrderConnector
  ) {}
}
