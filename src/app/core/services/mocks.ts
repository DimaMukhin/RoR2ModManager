import {
  UserPreferences,
  defaultConfig
} from '../../../electron/preferences.model';
import { ChangeEvent } from './preferences.service';
import { Observable, of } from 'rxjs';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { PackageList, Package, PackageVersion } from '../models/package.model';

export class MockPreferencesService {
  private data: UserPreferences = defaultConfig;

  set<K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) {
    this.data[key] = value;
  }

  get<K extends keyof UserPreferences>(key: K) {
    return this.data;
  }

  onChange<K extends keyof UserPreferences>(
    key: K
  ): Observable<ChangeEvent<UserPreferences[K]>> {
    return of({ oldValue: undefined, newValue: undefined });
  }
}

export class MockHttpClient {
  get() {}
  post() {}
  delete() {}
  put() {}
}

export class MockThemeService {
  private isDarkModeSource = new BehaviorSubject<boolean>(false);
  isDarkMode$ = this.isDarkModeSource.asObservable();
  themeClass$ = this.isDarkModeSource
    .asObservable()
    .pipe(map(darkMode => (darkMode ? 'app-dark-theme' : 'app-light-theme')));
  toggleDarkMode() {
    this.isDarkModeSource.next(!this.isDarkModeSource.value);
  }
}

export class MockPackageService {
  installedPackages$ = new BehaviorSubject<PackageList>([]);

  installPackage(pkg: Package, version: PackageVersion) {
    this.installedPackages$.next([...this.installedPackages$.value, pkg]);
  }

  public uninstallPackage(pkg: Package) {
    this.installedPackages$.next(
      this.installedPackages$.value.filter(
        installed => installed.uuid4 !== pkg.uuid4
      )
    );
  }

  public updatePackage(pkg: Package, version: PackageVersion) {}
}
