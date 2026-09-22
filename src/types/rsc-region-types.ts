/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Rackspace Cloud Files region identifiers.
 *
 * This type represents all valid region values for Rackspace Cloud Files,
 * using IATA airport codes to identify data center locations.
 *
 * Rackspace Cloud Files is a cloud storage service that uses geographically
 * distributed data centers.  Each region is identified by its three-letter
 * IATA airport code corresponding to the data center location.
 *
 * @remarks
 * - All region codes follow IATA airport code format (3 uppercase letters)
 * - Default region is DFW (Dallas/Fort Worth)
 * - Regions span North America, Europe, Asia-Pacific
 *
 * @see {@link https://docs.rackspace.com/support/how-to/about-regions/ | Rackspace Regions Documentation}
 * @see {@link https://developer.rackspace.com/docs/cloud-files/v1/ | Rackspace Cloud Files API}
 */
export type RackspaceRegion =
    | 'DFW' // Dallas (DFW) - Default
    | 'ORD' // Chicago (ORD)
    | 'SYD' // Sydney (SYD)
    | 'LON' // London (LON)
    | 'IAD' // Northern Virginia (IAD)
    | 'HKG'; // Hong Kong (HKG)

/**
 * Mapping of Rackspace region codes to human-readable display names.
 * Useful for rendering dropdowns or displaying region information to users.
 *
 * @example
 * ```typescript
 * const displayName = RACKSPACE_REGION_LABELS['DFW']; // "Dallas (DFW)"
 * ```
 */
export const RACKSPACE_REGION_LABELS: Record<RackspaceRegion, string> = {
    DFW: 'Dallas (DFW)',
    ORD: 'Chicago (ORD)',
    SYD: 'Sydney (SYD)',
    LON: 'London (LON)',
    IAD: 'Northern Virginia (IAD)',
    HKG: 'Hong Kong (HKG)'
} as const;

/**
 * Geographic grouping of Rackspace regions by continent/area.
 * Useful for organizing regions in UI or applying regional logic.
 */
export const RACKSPACE_REGIONS_BY_GEOGRAPHY = {
    northAmerica: ['DFW', 'ORD', 'IAD'] as const,
    europe: ['LON'] as const,
    asiaPacific: ['SYD', 'HKG'] as const
} as const;

/**
 * Default Rackspace region (London - LON)
 */
export const DEFAULT_RACKSPACE_REGION: RackspaceRegion = 'LON';

/**
 * Type guard to check if a string is a valid RackspaceRegion.
 *
 * @param value - The value to check
 * @returns True if the value is a valid RackspaceRegion
 *
 * @example
 * ```typescript
 * const region = 'DFW';
 * if (isValidRackspaceRegion(region)) {
 *   // TypeScript now knows region is of type RackspaceRegion
 *   console.log(RACKSPACE_REGION_LABELS[region]);
 * }
 * ```
 */
export function isValidRackspaceRegion(
    value: string
): value is RackspaceRegion {
    return value in RACKSPACE_REGION_LABELS;
}

/**
 * Get all available Rackspace regions as an array.
 * Useful for iteration or validation purposes.
 *
 * @returns Array of all valid RackspaceRegion values
 *
 * @example
 * ```typescript
 * const regions = getAllRackspaceRegions();
 * // ['DFW', 'ORD', 'SYD', 'LON', 'IAD', 'HKG']
 * ```
 */
export function getAllRackspaceRegions(): readonly RackspaceRegion[] {
    return Object.keys(RACKSPACE_REGION_LABELS) as RackspaceRegion[];
}
