/**
 * Default attorney information for RECA claims
 *
 * RadiantClaims partners with licensed attorneys to provide legal representation
 * for RECA claims. Users of the service automatically opt-in to attorney representation.
 */

export const DEFAULT_ATTORNEY_INFO = {
  hasAttorney: "YES" as const,
  attorneyFirstName: "Ryan",
  attorneyLastName: "Taylor",
  attorneyFirm: "Heritage Law Offices",
  attorneyAddress: "898 South State St, Suite 100",
  attorneyCity: "Orem",
  attorneyState: "Utah",
  attorneyZip: "84097",
  attorneyPhone: "(801) 609-8182",
  attorneyFax: "",
  attorneyEmail: "heritagelaw@radiantclaims.com",
};

/**
 * Attorney fee type for RECA claims
 * RadiantClaims + partner attorneys use the 2% initial claim fee structure
 */
export const DEFAULT_ATTORNEY_FEE_TYPE = "initial_2_percent" as const;

/**
 * Whether the attorney information fields should be editable
 * Set to false to lock the fields since this is a required service component
 */
export const ATTORNEY_INFO_EDITABLE = false;
