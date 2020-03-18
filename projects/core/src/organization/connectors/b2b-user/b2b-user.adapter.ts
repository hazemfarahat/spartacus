import { Observable } from 'rxjs';
import { B2BSearchConfig } from '../../model/search-config';
import { EntitiesModel } from '../../../model/misc.model';
import { B2BUser } from '../../../model/org-unit.model';

export abstract class B2BUserAdapter {
  /**
   * Abstract method used to load orgUnitCustomerManagement's details data.
   * orgUnitCustomer's data can be loaded from alternative sources, as long as the structure
   * converts to the `B2BUser`.
   *
   * @param userId The `userId` for given orgUnitCustomerManagement
   * @param orgCustomerId The `orgUnitCustomerId` for given orgUnitCustomerManagement
   */
  abstract load(userId: string, orgCustomerId: string): Observable<B2BUser>;

  abstract loadList(
    userId: string,
    params?: B2BSearchConfig
  ): Observable<EntitiesModel<B2BUser>>;

  // abstract loadApprovers(
  //   userId: string,
  //   orgCustomerId: string,
  //   params?: B2BSearchConfig
  // ): Observable<EntitiesModel<B2BUser>>;

  // abstract loadUserGroups(
  //   userId: string,
  //   orgCustomerId: string,
  //   params?: B2BSearchConfig
  // ): Observable<EntitiesModel<any>>; // TODO: change the type to user groups when they are ready
}
