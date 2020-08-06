import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  Configurator,
  ConfiguratorCommonsService,
  ConfiguratorGroupsService,
} from '@spartacus/core';
import { Observable, of } from 'rxjs';
import { delay, map, switchMap, take } from 'rxjs/operators';
import {
  ConfigRouterExtractorService,
  ConfigurationRouter,
  HamburgerMenuService,
} from '@spartacus/storefront';
import { ICON_TYPE } from '@spartacus/storefront';

@Component({
  selector: 'cx-config-group-menu',
  templateUrl: './config-group-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigGroupMenuComponent {
  routerData$: Observable<
    ConfigurationRouter.Data
  > = this.configRouterExtractorService.extractRouterData();

  configuration$: Observable<
    Configurator.Configuration
  > = this.routerData$.pipe(
    switchMap((routerData) =>
      this.configCommonsService.getConfiguration(routerData.owner)
    )
  );

  currentGroup$: Observable<Configurator.Group> = this.routerData$.pipe(
    switchMap((routerData) =>
      this.configuratorGroupsService.getCurrentGroup(routerData.owner)
    )
  );

  displayedParentGroup$: Observable<
    Configurator.Group
  > = this.configuration$.pipe(
    switchMap((configuration) =>
      this.configuratorGroupsService.getMenuParentGroup(configuration.owner)
    ),
    switchMap((parentGroup) => this.getCondensedParentGroup(parentGroup))
  );

  displayedGroups$: Observable<
    Configurator.Group[]
  > = this.displayedParentGroup$.pipe(
    switchMap((parentGroup) => {
      return this.configuration$.pipe(
        map((configuration) => {
          if (parentGroup) {
            return this.condenseGroups(parentGroup.subGroups);
          } else {
            return this.condenseGroups(configuration.groups);
          }
        }),
        delay(0)
      );
    })
  );

  iconTypes = ICON_TYPE;
  GROUPSTATUS = Configurator.GroupStatus;

  constructor(
    private configCommonsService: ConfiguratorCommonsService,
    public configuratorGroupsService: ConfiguratorGroupsService,
    private hamburgerMenuService: HamburgerMenuService,
    private configRouterExtractorService: ConfigRouterExtractorService
  ) {}

  /**
   * Executes a click event to the given group.
   *
   * @param event - Keyboard event
   * @param {Configurator.Group} group - Entered group
   */
  clickOnEnter(event, group: Configurator.Group): void {
    if (event.which === 13) {
      this.click(group);
    }
  }

  click(group: Configurator.Group): void {
    this.configuration$.pipe(take(1)).subscribe((configuration) => {
      if (!this.configuratorGroupsService.hasSubGroups(group)) {
        this.scrollToVariantConfigurationHeader();
        this.configuratorGroupsService.navigateToGroup(configuration, group.id);
        this.hamburgerMenuService.toggle(true);
      } else {
        this.configuratorGroupsService.setMenuParentGroup(
          configuration.owner,
          group.id
        );
      }
    });
  }

  /**
   * Navigates to the subgroup.
   *
   * @param event
   */
  navigateUpOnEnter(event): void {
    if (event.which === 13) {
      this.navigateUp();
    }
  }

  navigateUp(): void {
    this.displayedParentGroup$
      .pipe(take(1))
      .subscribe((displayedParentGroup) => {
        const parentGroup$ = this.getParentGroup(displayedParentGroup);
        this.configuration$.pipe(take(1)).subscribe((configuration) => {
          parentGroup$
            .pipe(take(1))
            .subscribe((parentGroup) =>
              this.configuratorGroupsService.setMenuParentGroup(
                configuration.owner,
                parentGroup ? parentGroup.id : null
              )
            );
        });
      });
  }

  /**
   * Retrieves the number of conflicts for the current group.
   *
   * @param {Configurator.Group} group - Current group
   * @return {string} - number of conflicts
   */
  getConflictNumber(group: Configurator.Group): string {
    if (group.groupType === Configurator.GroupType.CONFLICT_HEADER_GROUP) {
      return '(' + group.subGroups.length + ')';
    }
    return '';
  }

  protected getParentGroup(
    group: Configurator.Group
  ): Observable<Configurator.Group> {
    return this.configuration$.pipe(
      map((configuration) =>
        this.configuratorGroupsService.getParentGroup(
          configuration.groups,
          group,
          null
        )
      )
    );
  }

  getCondensedParentGroup(
    parentGroup: Configurator.Group
  ): Observable<Configurator.Group> {
    if (
      parentGroup &&
      parentGroup.subGroups &&
      parentGroup.subGroups.length === 1 &&
      parentGroup.groupType !== Configurator.GroupType.CONFLICT_HEADER_GROUP
    ) {
      return this.getParentGroup(parentGroup).pipe(
        switchMap((group) => this.getCondensedParentGroup(group))
      );
    } else {
      return of(parentGroup);
    }
  }

  condenseGroups(groups: Configurator.Group[]): Configurator.Group[] {
    return groups.flatMap((group) => {
      if (
        group.subGroups.length === 1 &&
        group.groupType !== Configurator.GroupType.CONFLICT_HEADER_GROUP
      ) {
        return this.condenseGroups(group.subGroups);
      } else {
        return group;
      }
    });
  }

  /**
   * Retrieves the status of the current group.
   *
   * @param {Configurator.Group} group - Current group
   * @param {Configurator.Configuration} configuration - Configuration
   * @return {Observable<string>} - Group status
   */
  getGroupStatus(
    group: Configurator.Group,
    configuration: Configurator.Configuration
  ): Observable<string> {
    return this.configuratorGroupsService
      .isGroupVisited(configuration.owner, group.id)
      .pipe(
        switchMap((isVisited) => {
          if (isVisited && !this.isConflictGroupType(group.groupType)) {
            return this.configuratorGroupsService.getGroupStatus(
              configuration.owner,
              group.id
            );
          } else {
            return of(null);
          }
        })
      );
  }

  /**
   * Verifies whether the current group is conflict one.
   *
   * @param {Configurator.GroupType} groupType - Group type
   * @return {boolean} - 'True' if the current group is conflict one, otherwise 'false'.
   */
  isConflictGroupType(groupType: Configurator.GroupType): boolean {
    if (
      groupType === Configurator.GroupType.CONFLICT_HEADER_GROUP ||
      groupType === Configurator.GroupType.CONFLICT_GROUP
    ) {
      return true;
    }
    return false;
  }

  protected scrollToVariantConfigurationHeader(): void {
    const theElement = document.querySelector('.VariantConfigurationTemplate');
    let topOffset = 0;
    if (theElement instanceof HTMLElement) {
      topOffset = theElement.offsetTop;
    }
    window.scroll(0, topOffset);
  }
}