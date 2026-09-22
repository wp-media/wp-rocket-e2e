/* eslint-disable @typescript-eslint/naming-convention */
/**
 * AWS S3 and compatible cloud storage region identifiers. 
 * 
 * This type represents all valid region values for the S3 region selector,
 * including AWS S3 regions, Google Cloud Storage regions, and other S3-compatible
 * storage providers like DigitalOcean Spaces, Scaleway, and DreamHost.
 * 
 * @remarks
 * - AWS regions follow the pattern: {geo}-{direction}-{number}
 * - AWS GovCloud regions are prefixed with 'us-gov-'
 * - Google Storage uses descriptive region names
 * - Third-party providers use their own naming conventions
 * 
 * @see {@link https://docs.aws.amazon.com/general/latest/gr/s3.html | AWS S3 Regions}
 * @see {@link https://cloud.google.com/storage/docs/locations | Google Cloud Storage Locations}
 */
export type S3Region =
  // AWS S3 - US Regions
  | 'us-east-2'        // US East (Ohio)
  | 'us-east-1'        // US East (N. Virginia) - Default
  | 'us-west-1'        // US West (N. California)
  | 'us-west-2'        // US West (Oregon)
  
  // AWS S3 - Africa
  | 'af-south-1'       // Africa (Cape Town)
  
  // AWS S3 - Asia Pacific
  | 'ap-east-1'        // Asia Pacific (Hong Kong)
  | 'ap-southeast-3'   // Asia Pacific (Jakarta)
  | 'ap-south-1'       // Asia Pacific (Mumbai)
  | 'ap-northeast-3'   // Asia Pacific (Osaka)
  | 'ap-northeast-2'   // Asia Pacific (Seoul)
  | 'ap-southeast-1'   // Asia Pacific (Singapore)
  | 'ap-southeast-2'   // Asia Pacific (Sydney)
  | 'ap-northeast-1'   // Asia Pacific (Tokyo)
  
  // AWS S3 - Canada
  | 'ca-central-1'     // Canada (Central)
  
  // AWS S3 - Europe
  | 'eu-central-1'     // Europe (Frankfurt)
  | 'eu-west-1'        // Europe (Ireland)
  | 'eu-west-2'        // Europe (London)
  | 'eu-south-1'       // Europe (Milan)
  | 'eu-west-3'        // Europe (Paris)
  | 'eu-north-1'       // Europe (Stockholm)
  
  // AWS S3 - Middle East
  | 'me-south-1'       // Middle East (Bahrain)
  
  // AWS S3 - South America
  | 'sa-east-1'        // South America (São Paulo)
  
  // AWS GovCloud
  | 'us-gov-east-1'    // AWS GovCloud (US-East)
  | 'us-gov-west-1'    // AWS GovCloud (US-West)
  
  // Google Cloud Storage
  | 'google-storage'      // EU (Multi-Regional)
  | 'google-storage-us'   // USA (Multi-Regional)
  | 'google-storage-asia' // Asia (Multi-Regional)
  
  // DreamHost
  | 'dreamhost'        // Dream Host Cloud Storage
  
  // DigitalOcean Spaces
  | 'digital-ocean-sfo2' // DigitalOcean:  SFO2
  | 'digital-ocean-nyc3' // DigitalOcean: NYC3
  | 'digital-ocean-ams3' // DigitalOcean:  AMS3
  | 'digital-ocean-sgp1' // DigitalOcean:  SGP1
  | 'digital-ocean-fra1' // DigitalOcean: FRA1
  
  // Scaleway Object Storage
  | 'scaleway-ams'     // Scaleway: AMS (Amsterdam)
  | 'scaleway-par'     // Scaleway: PAR (Paris)
  
  // Custom Configuration
  | 'custom';          // Custom S3-compatible endpoint

/**
 * Mapping of region codes to human-readable display names.
 * Useful for rendering dropdowns or displaying region information to users.
 */
export const S3_REGION_LABELS: Record<S3Region, string> = {
  'us-east-2': 'Amazon S3: US East (Ohio)',
  'us-east-1': 'Amazon S3: US East (N. Virginia)',
  'us-west-1': 'Amazon S3: US West (N. California)',
  'us-west-2': 'Amazon S3: US West (Oregon)',
  'af-south-1': 'Amazon S3: Africa (Cape Town)',
  'ap-east-1': 'Amazon S3: Asia Pacific (Hong Kong)',
  'ap-southeast-3': 'Amazon S3: Asia Pacific (Jakarta)',
  'ap-south-1': 'Amazon S3: Asia Pacific (Mumbai)',
  'ap-northeast-3': 'Amazon S3: Asia Pacific (Osaka)',
  'ap-northeast-2': 'Amazon S3: Asia Pacific (Seoul)',
  'ap-southeast-1': 'Amazon S3: Asia Pacific (Singapore)',
  'ap-southeast-2': 'Amazon S3: Asia Pacific (Sydney)',
  'ap-northeast-1': 'Amazon S3: Asia Pacific (Tokyo)',
  'ca-central-1': 'Amazon S3: Canada (Central)',
  'eu-central-1': 'Amazon S3: Europe (Frankfurt)',
  'eu-west-1': 'Amazon S3: Europe (Ireland)',
  'eu-west-2':  'Amazon S3: Europe (London)',
  'eu-south-1': 'Amazon S3: Europe (Milan)',
  'eu-west-3': 'Amazon S3: Europe (Paris)',
  'eu-north-1': 'Amazon S3: Europe (Stockholm)',
  'me-south-1': 'Amazon S3: Middle East (Bahrain)',
  'sa-east-1': 'Amazon S3: South America (São Paulo)',
  'us-gov-east-1': 'Amazon S3: AWS GovCloud (US-East)',
  'us-gov-west-1': 'Amazon S3: AWS GovCloud (US-West)',
  'google-storage': 'Google Storage:  EU (Multi-Regional)',
  'google-storage-us': 'Google Storage: USA (Multi-Regional)',
  'google-storage-asia': 'Google Storage:  Asia (Multi-Regional)',
  'dreamhost': 'Dream Host Cloud Storage',
  'digital-ocean-sfo2': 'DigitalOcean: SFO2',
  'digital-ocean-nyc3': 'DigitalOcean:  NYC3',
  'digital-ocean-ams3': 'DigitalOcean: AMS3',
  'digital-ocean-sgp1': 'DigitalOcean: SGP1',
  'digital-ocean-fra1': 'DigitalOcean: FRA1',
  'scaleway-ams': 'Scaleway: AMS',
  'scaleway-par':  'Scaleway: PAR',
  'custom': 'Custom',
} as const;

/**
 * Default S3 region (US East - N. Virginia)
 */
export const DEFAULT_S3_REGION: S3Region = 'us-east-1';

/**
 * Type guard to check if a string is a valid S3Region
 * 
 * @param value - The value to check
 * @returns True if the value is a valid S3Region
 * 
 * @example
 * ```typescript
 * const region = 'us-east-1';
 * if (isValidS3Region(region)) {
 *   // TypeScript now knows region is of type S3Region
 *   console.log(S3_REGION_LABELS[region]);
 * }
 * ```
 */
export function isValidS3Region(value: string): value is S3Region {
  return value in S3_REGION_LABELS;
}