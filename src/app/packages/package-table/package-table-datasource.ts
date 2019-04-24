import { DataSource } from '@angular/cdk/collections';
import { MatPaginator, MatSort } from '@angular/material';
import { map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { Observable, merge, Subscription, BehaviorSubject } from 'rxjs';
import { PackageList, Package } from '../../core/models/package.model';
import { ThunderstoreService } from '../../core/services/thunderstore.service';
import { FormControl } from '@angular/forms';

/**
 * Data source for the PackageTable view. This class should
 * encapsulate all logic for fetching and manipulating the displayed data
 * (including sorting, pagination, and filtering).
 */
export class PackageTableDataSource extends DataSource<Package> {
  private dataSource = new BehaviorSubject<PackageList>([]);
  data: PackageList;
  filteredData: PackageList;

  private loadingSource = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSource
    .asObservable()
    .pipe(distinctUntilChanged());

  private subscription = new Subscription();

  constructor(
    private paginator: MatPaginator,
    private sort: MatSort,
    private filter: FormControl,
    private thunderstore: ThunderstoreService
  ) {
    super();
    this.dataSource.subscribe(data => {
      this.data = data;
      this.filteredData = this.getFilteredData(data);
      this.paginator.length = this.filteredData.length;
    });
  }

  /**
   * Connect this data source to the table. The table will only update when
   * the returned stream emits new items.
   * @returns A stream of the items to be rendered.
   */
  connect(): Observable<PackageList> {
    // Combine everything that affects the rendered data into one update
    // stream for the data-table to consume.
    const dataMutations = [
      this.dataSource,
      this.paginator.page,
      this.sort.sortChange,
      this.filter.valueChanges.pipe(
        distinctUntilChanged(),
        debounceTime(100)
      )
    ];

    this.subscription.add(
      this.thunderstore.allPackages$.subscribe(packages => {
        if (packages) {
          this.dataSource.next(packages);
          this.loadingSource.next(false);
        } else {
          this.loadingSource.next(true);
        }
      })
    );

    this.subscription.add(
      this.filter.valueChanges.subscribe(() => {
        this.filteredData = this.getFilteredData(this.data);
        this.paginator.length = this.filteredData.length;
      })
    );

    return merge(...dataMutations).pipe(
      map(() => {
        return this.getPagedData(this.getSortedData([...this.filteredData]));
      })
    );
  }

  /**
   *  Called when the table is being destroyed. Use this function, to clean up
   * any open connections or free any held resources that were set up during connect.
   */
  disconnect() {
    this.subscription.unsubscribe();
  }

  /**
   * Paginate the data (client-side). If you're using server-side pagination,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getPagedData(data: PackageList): PackageList {
    const startIndex = this.paginator.pageIndex * this.paginator.pageSize;
    return data.splice(startIndex, this.paginator.pageSize);
  }

  /**
   * Sort the data (client-side). If you're using server-side sorting,
   * this would be replaced by requesting the appropriate data from the server.
   */
  private getSortedData(data: PackageList): PackageList {
    if (!this.sort.active || this.sort.direction === '') {
      return data;
    }

    return data.sort((a, b) => {
      const isAsc = this.sort.direction === 'asc';
      switch (this.sort.active) {
        case 'name':
          return compare(a.name, b.name, isAsc);
        case 'id':
          return compare(a.uuid4, b.uuid4, isAsc);
        case 'author':
          return compare(a.owner, b.owner, isAsc);
        case 'updated':
          return compare(a.date_updated, b.date_updated, isAsc);
        case 'select':
          return compare(!!a.selected, !!b.selected, !isAsc);
        default:
          return 0;
      }
    });
  }

  private getFilteredData(data: PackageList): PackageList {
    const filterText = (this.filter.value as string).toLowerCase();
    if (filterText && filterText.length > 0) {
      return data.filter(
        pkg =>
          pkg.name.toLowerCase().includes(filterText) ||
          pkg.owner.toLowerCase().includes(filterText) ||
          pkg.latest_version.description
            .toLocaleLowerCase()
            .includes(filterText)
      );
    } else {
      return data;
    }
  }
}

/** Simple sort comparator for example ID/Name columns (for client-side sorting). */
function compare(a: any, b: any, isAsc: boolean) {
  if (typeof a === 'string') {
    a = a.toUpperCase();
  }
  if (typeof b === 'string') {
    b = b.toUpperCase();
  }
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}
