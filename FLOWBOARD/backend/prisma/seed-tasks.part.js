/** Task definitions used by the seed. Split by project for readability. */
const day = 24 * 60 * 60 * 1000;
const daysAgo = (n) => new Date(Date.now() - n * day);
const daysFromNow = (n) => new Date(Date.now() + n * day);

const TASKS_WEB = [
  {
    project: 'web', title: 'Audit current site analytics',
    description: 'Pull the last 90 days of traffic, conversion and bounce data so the redesign is measured against a real baseline rather than a guess.',
    status: 'DONE', priority: 'MEDIUM', assignee: 'rohan', due: daysAgo(26), created: 32,
    comments: [
      { author: 'aarav', content: 'Baseline report is linked in the project doc. Mobile traffic is up 38% QoQ, which is the main argument for prioritising the responsive pass.', age: 28 },
      { author: 'rohan', content: 'Added the funnel breakdown. Checkout drop-off is almost entirely on the mobile payment step.', age: 27 },
    ],
  },
  {
    project: 'web', title: 'Design system: colour, type and spacing tokens',
    description: 'Define the neutral palette, the type scale and the 4px spacing grid. Everything else in the revamp references these tokens.',
    status: 'DONE', priority: 'HIGH', assignee: 'emily', due: daysAgo(20), created: 30,
    comments: [
      { author: 'emily', content: 'Tokens are in the shared Figma library. Kept contrast at or above WCAG AA for every text pairing.', age: 25 },
      { author: 'priya', content: 'Approved. Let us lock the neutrals and stop iterating on them for the rest of the project.', age: 24 },
    ],
  },
  {
    project: 'web', title: 'Rebuild marketing homepage hero',
    description: 'New hero with the product screenshot, the "Plan. Collaborate. Deliver." headline and a single primary CTA. Must load under 2s on 4G.',
    status: 'DONE', priority: 'URGENT', assignee: 'emily', due: daysAgo(12), created: 26,
    comments: [
      { author: 'aarav', content: 'This is the version we shipped. LCP dropped from 3.4s to 1.6s after moving the screenshot to AVIF.', age: 12 },
    ],
  },
  {
    project: 'web', title: 'New pricing page with comparison table',
    description: 'Three tiers, an honest comparison table and an FAQ block. Copy reviewed by legal before launch.',
    status: 'IN_REVIEW', priority: 'HIGH', assignee: 'sana', due: daysFromNow(3), created: 20,
    comments: [
      { author: 'sana', content: 'First draft is up. Waiting on the legal read for the data-export line item.', age: 6 },
      { author: 'priya', content: 'The comparison table reads well. Let us make the "most popular" badge more subtle so it stops looking like an ad.', age: 2 },
      { author: 'aarav', content: 'Agreed - tone it down and we are good to ship.', age: 1 },
    ],
  },
  {
    project: 'web', title: 'Responsive navigation for tablet widths',
    description: 'The desktop nav breaks between 768px and 1024px. Collapsible sidebar plus a top bar that stays readable in portrait.',
    status: 'IN_PROGRESS', priority: 'MEDIUM', assignee: 'rohan', due: daysFromNow(9), created: 18,
    comments: [
      { author: 'rohan', content: 'Collapsible sidebar is working on iPad. Still need the keyboard focus trap before this is done.', age: 4 },
    ],
  },
  {
    project: 'web', title: 'Migrate blog templates to the new grid',
    description: 'Eleven templates still reference the old container widths. Port them to the 1320px container and the new spacing scale.',
    status: 'IN_PROGRESS', priority: 'LOW', assignee: 'sana', due: daysFromNow(16), created: 16,
    comments: [],
  },
  {
    project: 'web', title: 'Accessibility pass: keyboard and screen reader',
    description: 'Full keyboard traversal, focus order, ARIA labels on the board columns and a screen reader run through the core flows.',
    status: 'TODO', priority: 'HIGH', assignee: 'rohan', due: daysFromNow(20), created: 14,
    comments: [
      { author: 'priya', content: 'Please do this before the launch announcement - we got feedback on the old site about exactly this.', age: 5 },
    ],
  },
  {
    project: 'web', title: 'Redirect map for retired URLs',
    description: 'Map the 40 URLs losing traffic after the revamp to their new equivalents and confirm nothing 404s after launch.',
    status: 'TODO', priority: 'MEDIUM', assignee: null, due: daysFromNow(22), created: 12,
    comments: [],
  },
  {
    project: 'web', title: 'Set up visual regression tests',
    description: 'Snapshot the key marketing and auth pages in CI so future styling changes surface diffs before review.',
    status: 'DONE', priority: 'LOW', assignee: 'emily', due: daysAgo(18), created: 15,
    comments: [],
  },
];

const TASKS_MOBILE = [
  {
    project: 'mobile', title: 'Offline cache for board data',
    description: 'Cache the last fetched board so the app is usable on a plane. Re-sync task status changes the moment the connection returns.',
    status: 'IN_PROGRESS', priority: 'URGENT', assignee: 'daniel', due: daysFromNow(7), created: 11,
    comments: [
      { author: 'daniel', content: 'Read path is cached now. Write path is the hard part - queuing status changes without losing ordering.', age: 3 },
      { author: 'priya', content: 'Losing ordering is the one thing we cannot ship, so take the time needed. Everything else can slip.', age: 2 },
    ],
  },
  {
    project: 'mobile', title: 'Push notifications for task assignment',
    description: 'Notify assignees when a task lands on them, with a deep link straight into the task detail screen.',
    status: 'TODO', priority: 'HIGH', assignee: 'marcus', due: daysFromNow(14), created: 10,
    comments: [
      { author: 'marcus', content: 'Deep linking works on Android. iOS needs the notification service extension before beta.', age: 2 },
    ],
  },
  {
    project: 'mobile', title: 'Crash reporting and beta telemetry',
    description: 'Symbolicated crash reports plus a dashboard for beta testers: sessions, crashes per build, and opt-in diagnostics.',
    status: 'TODO', priority: 'MEDIUM', assignee: 'daniel', due: daysFromNow(21), created: 9,
    comments: [],
  },
  {
    project: 'mobile', title: 'Beta onboarding checklist',
    description: 'Six screens that get a new tester from install to their first board in under three minutes.',
    status: 'TODO', priority: 'MEDIUM', assignee: 'priya', due: daysFromNow(28), created: 8,
    comments: [],
  },
  {
    project: 'mobile', title: 'Privacy policy and store listings',
    description: 'Draft the privacy policy, app store descriptions, screenshots and the beta review notes for both stores.',
    status: 'IN_REVIEW', priority: 'HIGH', assignee: 'aarav', due: daysFromNow(10), created: 7,
    comments: [
      { author: 'aarav', content: 'Store listings drafted. The beta review note needs the demo account details from Priya before submission.', age: 4 },
    ],
  },
  {
    project: 'mobile', title: 'Design the empty states for first launch',
    description: 'New testers should see something useful, not a blank board. Empty states for no projects, no tasks and no comments.',
    status: 'IN_PROGRESS', priority: 'LOW', assignee: 'aarav', due: daysFromNow(18), created: 6,
    comments: [],
  },
  {
    project: 'mobile', title: 'Recruit 200 beta testers',
    description: 'Pull the waitlist, segment by platform and send the invite waves. Target 200 active testers across both stores.',
    status: 'TODO', priority: 'MEDIUM', assignee: 'marcus', due: daysFromNow(35), created: 5,
    comments: [],
  },
  {
    project: 'mobile', title: 'Test build signing and release pipeline',
    description: 'Automated beta builds for both platforms with the right signing identities and a one-command release for the team.',
    status: 'TODO', priority: 'HIGH', assignee: null, due: daysFromNow(25), created: 4,
    comments: [],
  },
];

const TASKS_SUPPORT = [
  {
    project: 'support', title: 'New help centre information architecture',
    description: 'Restructure 180 articles into four top-level categories with a search-first layout.',
    status: 'DONE', priority: 'HIGH', assignee: 'sana', due: daysAgo(70), created: 94,
    comments: [
      { author: 'sana', content: 'IA signed off. Search now resolves an average of 8 articles per query before the old nav was touched.', age: 78 },
    ],
  },
  {
    project: 'support', title: 'Macro library for the top 200 tickets',
    description: 'Write, review and publish macros covering the most frequent ticket types so reply time drops meaningfully.',
    status: 'DONE', priority: 'URGENT', assignee: 'marcus', due: daysAgo(40), created: 90,
    comments: [
      { author: 'marcus', content: '200 macros drafted, 40 still need a second pair of eyes on tone.', age: 60 },
      { author: 'daniel', content: 'I will take the billing ones personally this week.', age: 58 },
    ],
  },
  {
    project: 'support', title: 'SLA reporting dashboard',
    description: 'First response and resolution time per queue, with weekly export for the leadership review.',
    status: 'DONE', priority: 'MEDIUM', assignee: 'daniel', due: daysAgo(22), created: 80,
    comments: [
      { author: 'daniel', content: 'Dashboard is live. First response time is down 31% since the macros went out.', age: 22 },
    ],
  },
  {
    project: 'support', title: 'Train the support team on the new tools',
    description: 'Two workshops covering the new help centre, the macro editor and the SLA dashboard, plus a written playbook.',
    status: 'DONE', priority: 'MEDIUM', assignee: 'emily', due: daysAgo(16), created: 70,
    comments: [
      { author: 'emily', content: 'Both workshops done, 14 of 14 attended. Playbook is in the team space.', age: 16 },
    ],
  },
  {
    project: 'support', title: 'Migrate legacy ticket history',
    description: 'Move five years of ticket history into the new system with authors and timestamps intact.',
    status: 'DONE', priority: 'LOW', assignee: 'marcus', due: daysAgo(12), created: 60,
    comments: [],
  },
  {
    project: 'support', title: 'Post-launch review and retro',
    description: 'Capture what worked, what slipped and the follow-up items, then share the summary with the wider team.',
    status: 'DONE', priority: 'LOW', assignee: 'sana', due: daysAgo(9), created: 30,
    comments: [
      { author: 'sana', content: 'Retro summary shared. Ticket deflection is up 24% week over week, which is the number leadership cared about.', age: 9 },
    ],
  },
];

export const TASKS = [...TASKS_WEB, ...TASKS_MOBILE, ...TASKS_SUPPORT];


