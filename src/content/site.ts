/**
 * All page copy lives here so text can be edited without touching layout.
 *
 * A content collection would be overkill for two pages — this is a plain typed
 * module, and TypeScript fails the build if an entry is malformed.
 */

export interface Link {
  /**
   * The visible label, and the link's accessible name. Kept short — these sit
   * in a tight row.
   */
  text: string;
  href: string;
  /**
   * `↗` marks a link that leaves the site, `→` one that continues within the
   * same reading. Carried from the design, where the two are used distinctly.
   * Rendered `aria-hidden` — it is decoration, not part of the name.
   */
  glyph: '↗' | '→';
  /** Umami event name. Keep stable — renaming fragments historical data. */
  event: string;
}

export interface BioParagraph {
  /**
   * Optional bold lead-in, rendered inline before the text — the design uses
   * it once, for "Interests." Written separately rather than as inline
   * markup so the copy stays plain strings and needs no HTML escaping.
   */
  lead?: string;
  text: string;
}

export interface StackRow {
  /** Left column. Recedes behind the value it labels. */
  label: string;
  /** Right column. Free-form, comma-separated. */
  value: string;
}

export interface SiteContent {
  name: string;
  /** The single line under the name on the home card. Keep it to one line. */
  identity: string;
  bio: BioParagraph[];
  stack: StackRow[];
  /** Rendered as text links on the home card, and used as `sameAs`. */
  profiles: Link[];
  /** Rendered in the About page footer. */
  aboutLinks: Link[];
  /** Used as `jobTitle` in the Person structured data. */
  jobTitle: string;
  /**
   * Share-card image, site-root-relative. Served from `public/` rather than
   * astro:assets on purpose: crawlers and social scrapers need a stable URL,
   * and processed assets carry a content hash that changes between builds.
   */
  ogImage: string;
  /** Carried over from the previous site — removing it breaks Search Console. */
  googleSiteVerification: string;
}

export const site: SiteContent = {
  name: 'Koushik',

  identity: 'I design systems and build teams that ship',

  bio: [
    { text: 'As an engineer, I design and build systems. I build teams that deliver.' },
    {
      lead: 'Interests.',
      text: 'Building platforms and scalable distributed systems. Currently learning functional programming with OCaml.',
    },
  ],

  stack: [
    { label: 'Languages', value: 'TypeScript' },
    { label: 'Technologies', value: 'Node.js, React' },
    { label: 'Databases', value: 'MongoDB, PostgreSQL' },
    { label: 'DevOps & infra', value: 'AWS, Docker' },
  ],

  // These two are the `sameAs` set in the structured data, so they must be
  // exactly the outbound links rendered on the home page — structured data
  // that disagrees with the page it describes is worse than none at all.
  profiles: [
    {
      text: 'LinkedIn',
      href: 'https://www.linkedin.com/in/srikoushik/',
      glyph: '↗',
      event: 'outbound-linkedin',
    },
    {
      text: 'GitHub',
      href: 'https://github.com/srikoushik',
      glyph: '↗',
      event: 'outbound-github',
    },
  ],

  // Deeper destinations, surfaced only once a reader has opened About. Their
  // event names are distinct from the home card's so the two placements stay
  // separable in the analytics.
  aboutLinks: [
    {
      text: 'Projects',
      href: 'https://www.linkedin.com/in/srikoushik/details/projects/',
      glyph: '↗',
      event: 'about-outbound-projects',
    },
    {
      text: 'Blog',
      href: 'https://medium.com/@srikoushik',
      glyph: '→',
      event: 'about-outbound-blog',
    },
  ],

  jobTitle: 'Software Engineer',

  // TODO(koushik): this is currently the square profile photo, which pairs
  // with Twitter's `summary` card. Supply a designed 1200x630 card and switch
  // the card type to `summary_large_image` in Seo.astro for a wide preview.
  ogImage: '/me.jpg',

  googleSiteVerification: '3E6n8pS7eidjtwTD4pma59fyB7674Hw6Eez5r-HLDIU',
};
