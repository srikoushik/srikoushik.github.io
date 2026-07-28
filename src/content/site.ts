/**
 * All page copy lives here so text can be edited without touching layout.
 *
 * A content collection would be overkill for a single page — this is a plain
 * typed module, and TypeScript fails the build if an entry is malformed.
 */

export interface ExperienceEntry {
  role: string;
  organisation: string;
  /** Free-form, e.g. "2021 — Present". Rendered verbatim. */
  period: string;
  /** One or two sentences. What you owned and what it achieved. */
  summary: string;
}

export interface Profile {
  /** Used as the link's accessible name, since the icon carries no text. */
  label: string;
  href: string;
  icon: 'github' | 'linkedin';
  /** Umami event name. Keep stable — renaming fragments historical data. */
  event: string;
}

export interface SiteContent {
  name: string;
  /** The single line under the name. Keep it to one line. */
  identity: string;
  bio: string[];
  location: string;
  experience: ExperienceEntry[];
  interests: string[];
  /** Rendered as brand icons under the identity line. */
  profiles: Profile[];
  /** Omit or leave empty and the Contact section is not rendered. */
  email?: string;
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

  // TODO(koushik): replace with your own one-liner.
  identity: 'Software engineer',

  bio: [
    'As a software engineer, I am involved in building applications from scratch, designing application architecture and onboarding new team members.',
  ],

  location: 'Chennai by native, living in Bangalore.',

  // TODO(koushik): replace these placeholders with your real roles.
  // Deliberately left as obvious placeholders rather than invented history —
  // this is the section a hiring reader weighs most heavily.
  experience: [
    {
      role: 'TODO — your role',
      organisation: 'TODO — organisation',
      period: 'TODO — e.g. 2021 — Present',
      summary:
        'TODO — one or two sentences on what you owned and what it achieved. Concrete beats comprehensive.',
    },
  ],

  interests: [
    'Working with scalable distributed systems and practicing functional programming are my current interests.',
    'In my free time, I do adventure travel and scribble blogs.',
  ],

  // Each destination appears exactly once, so every Umami event name maps to
  // a single link. Labels are the accessible names — the icons carry no text,
  // so these are what a screen reader announces.
  profiles: [
    {
      label: 'LinkedIn — projects and experience',
      href: 'https://www.linkedin.com/in/srikoushik/',
      icon: 'linkedin',
      event: 'outbound-linkedin',
    },
    {
      label: 'GitHub — code',
      href: 'https://github.com/srikoushik',
      icon: 'github',
      event: 'outbound-github',
    },
  ],

  // TODO(koushik): add the address you want recruiters to use, or delete
  // this line and the Contact section falls away on its own.
  email: '',

  jobTitle: 'Software Engineer',

  // TODO(koushik): this is currently the square profile photo, which pairs
  // with Twitter's `summary` card. Supply a designed 1200x630 card and switch
  // the card type to `summary_large_image` in Seo.astro for a wide preview.
  ogImage: '/me.jpg',

  googleSiteVerification: '3E6n8pS7eidjtwTD4pma59fyB7674Hw6Eez5r-HLDIU',
};
