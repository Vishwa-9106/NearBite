import Image from "next/image";
import Link from "next/link";
import { Inter, Playfair_Display } from "next/font/google";
import styles from "./page.module.css";

const headingFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-landing-heading"
});

const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-landing-body"
});

const reasons = [
  {
    icon: "◷",
    title: "No Delivery Network Needed",
    description: "We handle pickup flow. You focus on preparing great food.",
    bullets: [
      "No driver management",
      "No vehicle costs",
      "No delivery delays",
      "Pickup OTP = secure handoff"
    ]
  },
  {
    icon: "▥",
    title: "Know Your Demand 30 Min Early",
    description: "Pre-orders give your team clarity and reduce wastage.",
    bullets: [
      "Forecast ingredient needs",
      "Optimize prep timing",
      "Reduce spoilage by 40%+",
      "Adjust menu with confidence"
    ]
  },
  {
    icon: "⌂",
    title: "100% Upfront Payment",
    description: "Every confirmed order is prepaid with transparent settlement.",
    bullets: [
      "Funds instantly available",
      "Zero payment risk",
      "Transparent settlement",
      "No processing headaches"
    ]
  }
] as const;

const steps = [
  {
    icon: "◻",
    title: "Sign Up",
    desc: "Verify with phone number via OTP"
  },
  {
    icon: "▤",
    title: "Submit Application",
    desc: "We review your FSSAI docs in 24 hours"
  },
  {
    icon: "✕",
    title: "Add Your Menu",
    desc: "Upload items with prices in minutes"
  },
  {
    icon: "◠",
    title: "Receive Orders",
    desc: "Get notified instantly on dashboard"
  },
  {
    icon: "✓",
    title: "Pickup & Payment",
    desc: "Customer collects, payment confirmed"
  }
] as const;

const stats = [
  { value: "500+", label: "Restaurants Listed" },
  { value: "50,000+", label: "Successful Pickups" },
  { value: "4.8★", label: "Avg Restaurant Rating" },
  { value: "35%", label: "Less Food Waste" }
] as const;

const testimonials = [
  {
    quote: "NearBite helped us reduce waste by 35%. We're not throwing food away anymore.",
    initial: "M",
    role: "Restaurant Owner",
    city: "Mumbai"
  },
  {
    quote: "Our pickup orders are 3x faster than delivery. Customers love the freshness.",
    initial: "B",
    role: "Restaurant Owner",
    city: "Bangalore"
  },
  {
    quote: "25% revenue increase in 3 months just from the convenience factor.",
    initial: "P",
    role: "Restaurant Owner",
    city: "Pune"
  }
] as const;

const faqs = [
  {
    category: "Cost & Pricing",
    questions: [
      {
        q: "What commission do you take?",
        a: "Pricing is transparent with no hidden delivery network costs. Exact fees are shown during onboarding."
      },
      {
        q: "Are there hidden fees?",
        a: "No. Platform pricing and settlement details are visible inside your dashboard."
      },
      {
        q: "How quickly do I get paid?",
        a: "Payments are confirmed upfront and settlements are processed as per your configured cycle."
      }
    ]
  },
  {
    category: "Operations",
    questions: [
      {
        q: "What if I'm too busy to add items to the menu?",
        a: "Start with a small menu first. You can update items anytime from the dashboard."
      },
      {
        q: "Can I set my own operating hours?",
        a: "Yes. You can define pickup timings, prep windows, and pause ordering whenever needed."
      },
      {
        q: "What if an order comes in I can't fulfill?",
        a: "You can manage availability in real-time to avoid unserviceable orders."
      }
    ]
  },
  {
    category: "Support & Refunds",
    questions: [
      {
        q: "What if a customer doesn't show up for pickup?",
        a: "Support can assist based on your policy and order status history."
      },
      {
        q: "Do you handle refunds for me?",
        a: "Refund flows are supported and tracked so your team can resolve issues quickly."
      }
    ]
  },
  {
    category: "Technology",
    questions: [
      {
        q: "Do I need special hardware?",
        a: "No special hardware needed. A phone or desktop with internet is enough."
      },
      {
        q: "How do I manage my menu?",
        a: "Menu updates, stock status, and pricing can be managed from your restaurant dashboard."
      }
    ]
  }
] as const;

const brandLogoSrc = "/assets/logo.jpg";
const heroFoodImageSrc = "/assets/restaurant-food.jpg";

export default function RestaurantLandingPage() {
  return (
    <main className={`${styles.page} ${headingFont.variable} ${bodyFont.variable}`}>
      <header className={styles.header}>
        <div className={styles.container}>
          <nav className={styles.navbar}>
            <div className={styles.brandWrap}>
              <div className={styles.brandIcon}>
                <Image src={brandLogoSrc} alt="NearBite logo" width={52} height={52} className={styles.brandLogo} />
              </div>
              <p className={styles.brandName}>NearBite</p>
            </div>
            <div className={styles.navLinks}>
              <a href="#benefits">Benefits</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#testimonials">Testimonials</a>
              <a href="#faq">FAQ</a>
            </div>
            <Link href="/login" className={styles.navCta}>
              List Your Restaurant
            </Link>
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={`${styles.container} ${styles.heroGrid}`}>
          <div className={styles.heroContent}>
            <div className={styles.verifiedBadge}>
              <span>🛡</span>
              <span>FSSAI Verified Platform</span>
            </div>
            <h1 className={styles.heroTitle}>
              <span>List Your Menu.</span>
              <span className={styles.accentText}>Get Customers.</span>
              <span>Keep It Simple.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Reach 10,000+ customers in your area who prefer pickup. Pre-orders mean zero waste, guaranteed
              payment, and fresh food every time.
            </p>
            <div className={styles.heroActions}>
              <Link href="/login" className={styles.primaryButton}>
                List Your Restaurant <span aria-hidden="true">→</span>
              </Link>
            </div>
            <p className={styles.heroMeta}>
              Join <strong>500+ restaurants</strong> getting orders daily
            </p>
          </div>

          <div className={styles.heroImageWrap}>
            <div className={styles.heroImageCard}>
              <Image
                src={heroFoodImageSrc}
                alt="Restaurant food spread"
                width={760}
                height={480}
                className={styles.heroImage}
                priority
              />
            </div>
            <div className={`${styles.floatingStat} ${styles.topStat}`}>
              <p className={styles.statValue}>4.8★</p>
              <p className={styles.statLabel}>Avg Rating</p>
            </div>
            <div className={`${styles.floatingStat} ${styles.bottomStat}`}>
              <p className={styles.statValue}>50K+</p>
              <p className={styles.statLabel}>Successful Pickups</p>
            </div>
          </div>
        </div>
      </section>

      <section id="benefits" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>WHY RESTAURANTS CHOOSE NEARBITE</p>
            <h2 className={styles.sectionTitle}>Three reasons to list today</h2>
          </div>

          <div className={styles.reasonsGrid}>
            {reasons.map((item) => (
              <article key={item.title} className={styles.reasonCard}>
                <div className={styles.reasonIcon}>{item.icon}</div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <ul>
                  {item.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`${styles.section} ${styles.warmSection}`}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>SIMPLE ONBOARDING</p>
            <h2 className={styles.sectionTitle}>Go live in 5 easy steps</h2>
          </div>

          <div className={styles.timeline}>
            <div className={styles.timelineLine} />
            <div className={styles.timelineGrid}>
              {steps.map((step, index) => (
                <article key={step.title} className={styles.timelineItem}>
                  <div className={styles.timelineIcon}>{step.icon}</div>
                  <p className={styles.stepNumber}>STEP {String(index + 1).padStart(2, "0")}</p>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="testimonials" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>TRUSTED BY RESTAURANTS</p>
            <h2 className={styles.sectionTitle}>Real results, real owners</h2>
          </div>

          <div className={styles.statsGrid}>
            {stats.map((stat) => (
              <article key={stat.label} className={styles.statCard}>
                <p className={styles.statCardValue}>{stat.value}</p>
                <p className={styles.statCardLabel}>{stat.label}</p>
              </article>
            ))}
          </div>

          <div className={styles.testimonialGrid}>
            {testimonials.map((item) => (
              <article key={`${item.initial}-${item.city}`} className={styles.testimonialCard}>
                <p className={styles.starRow}>★★★★★</p>
                <p className={styles.quote}>“{item.quote}”</p>
                <div className={styles.testimonialUser}>
                  <div className={styles.avatar}>{item.initial}</div>
                  <div>
                    <p className={styles.userRole}>{item.role}</p>
                    <p className={styles.userCity}>{item.city}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className={`${styles.section} ${styles.warmSection}`}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <p className={styles.sectionLabel}>GOT QUESTIONS?</p>
            <h2 className={styles.sectionTitle}>Frequently asked questions</h2>
          </div>

          <div className={styles.faqWrap}>
            {faqs.map((group) => (
              <div key={group.category} className={styles.faqCategory}>
                <h3>{group.category}</h3>
                <div className={styles.faqItems}>
                  {group.questions.map((item) => (
                    <details key={item.q} className={styles.faqItem}>
                      <summary>{item.q}</summary>
                      <p>{item.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.ctaPanel}>
            <div className={styles.ctaCornerTop} />
            <div className={styles.ctaCornerBottom} />
            <h2>Ready to grow your restaurant?</h2>
            <p>Join 500+ restaurants getting orders daily. No setup fees, no delivery headaches.</p>
            <div className={styles.ctaActions}>
              <Link href="/login" className={styles.ctaPrimary}>
                List Your Restaurant <span aria-hidden="true">→</span>
              </Link>
              <a href="#" className={styles.ctaSecondary}>
                Chat with Us
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <div className={styles.brandWrap}>
                <div className={styles.brandIcon}>
                  <Image src={brandLogoSrc} alt="NearBite logo" width={52} height={52} className={styles.brandLogo} />
                </div>
                <p className={styles.brandName}>NearBite</p>
              </div>
              <p>
                India's pickup-first food platform. Connecting hungry customers with restaurants that value
                freshness.
              </p>
            </div>

            <div>
              <h4>COMPANY</h4>
              <ul>
                <li>
                  <a href="#">About</a>
                </li>
                <li>
                  <a href="#">Blog</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">Support</a>
                </li>
              </ul>
            </div>

            <div>
              <h4>LEGAL</h4>
              <ul>
                <li>
                  <a href="#">FSSAI Policy</a>
                </li>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
                <li>
                  <a href="#">Terms of Service</a>
                </li>
                <li>
                  <a href="#">Refund Policy</a>
                </li>
              </ul>
            </div>

            <div>
              <h4>STAY UPDATED</h4>
              <p>Get NearBite tips & insights for restaurant owners.</p>
              <div className={styles.subscribeRow}>
                <input type="email" placeholder="Your email" />
                <button type="button">Join</button>
              </div>
            </div>
          </div>

          <div className={styles.footerBottom}>
            <p>© 2026 NearBite. All rights reserved.</p>
            <p>support@nearbite.in</p>
          </div>
        </div>
      </footer>
    </main>
  );
}

