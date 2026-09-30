import { Link } from 'react-router-dom';
import {
  AtSign,
  Briefcase,
  Camera,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const SHOP_LINKS = [
  { label: 'All products', to: '/products' },
  { label: 'New arrivals', to: '/products?sort=newest' },
  { label: 'Best rated', to: '/products?sort=rating' },
  { label: 'Under $150', to: '/products?maxPrice=150' },
  { label: 'Wishlist', to: '/wishlist' },
];

const ACCOUNT_LINKS = [
  { label: 'Sign in', to: '/login' },
  { label: 'Create account', to: '/register' },
  { label: 'Order history', to: '/account/orders' },
  { label: 'Profile settings', to: '/account/profile' },
  { label: 'Shopping bag', to: '/cart' },
];

const PROMISES = [
  { icon: Truck, title: 'Free express shipping', copy: 'On every order over $150' },
  { icon: RotateCcw, title: '30-day returns', copy: 'Free and no questions asked' },
  { icon: ShieldCheck, title: '2-year warranty', copy: 'On all electronics' },
  { icon: CreditCard, title: 'Secure payments', copy: 'Encrypted checkout' },
];

const SOCIALS = [
  { icon: Camera, label: 'Instagram', href: 'https://instagram.com' },
  { icon: AtSign, label: 'X', href: 'https://x.com' },
  { icon: Briefcase, label: 'LinkedIn', href: 'https://linkedin.com' },
];

const CONTACT = [
  { icon: Mail, value: 'support@novamart.com' },
  { icon: Phone, value: '+1 (415) 555-0132' },
  { icon: MapPin, value: '2140 Market Street, San Francisco, CA 94114' },
];

function FooterColumn({ title, links }) {
  return (
    <div>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="text-sm text-ink-600 transition hover:text-ink-950 dark:text-ink-300 dark:hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="mt-20 border-t border-ink-100 bg-white dark:border-ink-800 dark:bg-ink-950/40">
      <div className="container">
        <div className="grid gap-6 border-b border-ink-100 py-10 dark:border-ink-800 sm:grid-cols-2 lg:grid-cols-4">
          {PROMISES.map(({ icon: Icon, title, copy }) => (
            <div key={title} className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-100">
                <Icon className="size-[1.1rem]" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-ink-500 dark:text-ink-400">{copy}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-10 py-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label="NOVA MART home">
              <span className="grid size-9 place-items-center rounded-xl bg-ink-950 text-white dark:bg-white dark:text-ink-950">
                <Sparkles className="size-4" aria-hidden="true" />
              </span>
              <span className="font-display text-sm font-extrabold uppercase tracking-[0.24em]">
                Nova Mart
              </span>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              A considered store for tech, watches, sneakers and home essentials. Curated by people
              who care about the details - delivered to your door.
            </p>

            <div className="mt-5 flex gap-2">
              {SOCIALS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="grid size-9 place-items-center rounded-full border border-ink-200 text-ink-600 transition hover:border-ink-300 hover:text-ink-950 dark:border-ink-700 dark:text-ink-300 dark:hover:text-white"
                  aria-label={label}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Shop" links={SHOP_LINKS} />
          <FooterColumn title="Account" links={isAuthenticated ? ACCOUNT_LINKS.slice(2) : ACCOUNT_LINKS} />

          <div>
            <h3 className="text-sm font-semibold">Get in touch</h3>
            <ul className="mt-4 space-y-3 text-sm text-ink-600 dark:text-ink-300">
              {CONTACT.map(({ icon: Icon, value }) => (
                <li key={value} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-4 shrink-0 text-ink-400" aria-hidden="true" />
                  <span>{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col gap-4 border-t border-ink-100 py-6 dark:border-ink-800 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-500 dark:text-ink-400">
            © {new Date().getFullYear()} NOVA MART. Built as a CodeAlpha Full Stack Development
            internship submission.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-2xs font-semibold uppercase tracking-wider text-ink-400">
            {['Visa', 'Mastercard', 'Amex', 'COD'].map((method) => (
              <span key={method} className="rounded-md border border-ink-200 px-2 py-1 dark:border-ink-700">
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
