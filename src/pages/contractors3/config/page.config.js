
/**
 * @typedef {Object} TerritoryConfig
 * @property {boolean} available
 * @property {readonly string[]} regions
 */

/**
 * @typedef {Object} LinkConfig
 * @property {string} [url]
 * @property {string} [href]
 * @property {string} [display]
 * @property {string} [embedUrl]
 */

/**
 * @typedef {Object} PageConfig
 * @property {LinkConfig} phone
 * @property {LinkConfig} calendly
 * @property {string} video
 * @property {string} company
 * @property {TerritoryConfig} territory
 */

/** @type {PageConfig} */
export const PAGE_CONFIG = Object.freeze({
  phone: {
    href: "tel:+12038567938",
    display: "(203) 856-7938"
  },
  calendly: {
    url: "https://calendly.com/petervs/marketing-partnership",
    embedUrl: "https://calendly.com/petervs/marketing-partnership?hide_event_type_details=1&hide_gdpr_banner=1"
  },
  video: "https://vimeo.com/windowman/demo",
  company: "WindowMan",
  territory: Object.freeze({
    available: true,
    regions: Object.freeze(["Pacific Northwest", "Northern California", "Mountain West"])
  })
});

export default PAGE_CONFIG;