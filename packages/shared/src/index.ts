export interface PackageMetadata {
  readonly name: string;
  readonly description: string;
}

export const definePackageMetadata = (
  metadata: PackageMetadata,
): PackageMetadata => metadata;
