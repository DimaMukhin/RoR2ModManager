// formattated like {author}-{packagename}-{version}
type PackageNameVersion = string;

interface PackageBase {
  name: string;
  full_name: PackageNameVersion;
  is_active: boolean;
  date_created: Date;
  uuid4: string;
}

export interface Package extends PackageBase {
  owner: string;
  maintainers: string[];
  date_updated: Date;
  is_pinned: boolean;
  versions: PackageVersionList;

  // add on after getting result from api
  latest_version?: PackageVersion;
  total_downloads?: number;
  selected?: boolean;
  requiredBy?: Set<PackageVersion>;
}

export interface PackageVersion extends PackageBase {
  download_url: string;
  dependencies: PackageNameVersion[];
  downloads: number;
  version_number: string;
  website_url: string;
  description: string;
  icon: string;
  readme?: string;
  pkg?: Package;
}

export interface InstalledPackage extends Package {
  // undefined if no version is installed
  installed_version: PackageVersion | undefined;
}

export type PackageList = Package[];
export type PackageVersionList = PackageVersion[];
export type InstalledPackageList = InstalledPackage[];
