import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const pillars = [
  {
    icon: "F",
    title: "Fresh Food",
    points: ["Prepared after order", "Peak flavor", "No degradation"]
  },
  {
    icon: "$",
    title: "Save Money",
    points: ["Zero delivery fees", "No surge pricing", "Save up to 30%"]
  },
  {
    icon: "S",
    title: "Speed & Convenience",
    points: ["Ready in 15 minutes", "Order in 2 minutes", "Real-time tracking"]
  },
  {
    icon: "L",
    title: "Support Local",
    points: ["Direct to restaurants", "Community-driven", "Neighborhood gems"]
  }
] as const;

const steps = [
  {
    title: "Browse",
    desc: "Find nearby restaurants with your favorite cuisines"
  },
  {
    title: "Order",
    desc: "Add items, customize, and confirm your meal"
  },
  {
    title: "Pay",
    desc: "One-click checkout - fast, secure, done"
  },
  {
    title: "Pick Up",
    desc: "Track your order in real-time and collect with OTP"
  }
] as const;

const stats = [
  { value: "50K+", label: "Users" },
  { value: "200K+", label: "Orders" },
  { value: "500+", label: "Restaurants" },
  { value: "4.8*", label: "Rating" }
] as const;

const testimonials = [
  {
    quote: "Fresh dosa in 10 minutes? Game changer.",
    name: "Priya S.",
    city: "Bangalore",
    cuisine: "South Indian lover"
  },
  {
    quote: "Saved Rs 200 last month just by skipping delivery fees.",
    name: "Rahul M.",
    city: "Mumbai",
    cuisine: "Biryani enthusiast"
  },
  {
    quote: "The OTP pickup is so smooth. No more wrong orders!",
    name: "Ananya K.",
    city: "Delhi",
    cuisine: "Street food fan"
  },
  {
    quote: "I discovered the best momos joint near my office.",
    name: "Vikram T.",
    city: "Pune",
    cuisine: "Momo addict"
  }
] as const;

const faqs = [
  {
    q: "What if I forget to pick up my order?",
    a: "You will receive reminders in-app. If pickup is missed, the restaurant's policy applies and support can help with next steps."
  },
  {
    q: "Can I make special dietary requests?",
    a: "Yes. Add notes while ordering for spice level, allergies, or preferences. Restaurants confirm what they can accommodate."
  },
  {
    q: "What if my order is wrong or delayed?",
    a: "Use in-app support from your order status screen. We review with the restaurant and process refunds or credits when eligible."
  },
  {
    q: "How do I find restaurants near me?",
    a: "Turn on location access to see nearby pickup options, prep times, and distance so you can choose quickly."
  },
  {
    q: "Can I modify my order after placing it?",
    a: "Edits are possible before the restaurant starts preparation. After that, cancellation and refund rules may apply."
  },
  {
    q: "How do rewards and referrals work?",
    a: "Earn points on eligible orders and referral bonuses when friends complete their first order. Offers are visible in your profile."
  }
] as const;

export default function UserLandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.container}>
          <nav className={styles.navbar}>
            <div className={styles.brand}>
              <Image src="/assets/logo.jpg" alt="NearBite logo" width={34} height={34} className={styles.brandLogo} />
              <p>NearBite</p>
            </div>
            <div className={styles.navLinks}>
              <a href="#how-it-works">How it works</a>
              <a href="#why-pickup">Why Pickup</a>
              <a href="#testimonials">Testimonials</a>
              <a href="#faq">FAQ</a>
            </div>
            <Link href="/login" className={styles.navDownload}>
              Login
            </Link>
          </nav>
        </div>
      </header>

      <section className={styles.hero}>
        <Image
          src="/assets/user-hero-food.jpg"
          alt="Indian food spread on a table"
          fill
          className={styles.heroBackground}
          priority
        />
        <div className={styles.heroOverlay} />
        <div className={`${styles.container} ${styles.heroContent}`}>
          <div className={styles.heroBadge}>No delivery fees. Ever.</div>
          <h1 className={styles.heroTitle}>
            <span>Fresh Food.</span>
            <span className={styles.heroAccent}>Zero Delivery Wait.</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Order from nearby restaurants. Pick up hot. Save money. <strong>No delivery fees. Ever.</strong>
          </p>
          <div className={styles.heroActions}>
            <Link href="/login" className={styles.primaryButton}>
              Login
            </Link>
          </div>
          <p className={styles.heroMeta}>No credit card required</p>
        </div>
      </section>

      <section id="why-pickup" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2>
              Why choose <span>pickup</span>?
            </h2>
            <p>Four reasons your next meal should be a pickup order.</p>
          </div>
          <div className={styles.pillarGrid}>
            {pillars.map((item) => (
              <article key={item.title} className={styles.pillarCard}>
                <p className={styles.pillarIcon} aria-hidden="true">
                  {item.icon}
                </p>
                <h3>{item.title}</h3>
                <ul>
                  {item.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className={`${styles.section} ${styles.softSection}`}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2>How it works</h2>
            <p>From craving to eating in 4 simple steps.</p>
          </div>
          <div className={styles.stepLine} />
          <div className={styles.stepGrid}>
            {steps.map((step, index) => (
              <article key={step.title} className={styles.stepCard}>
                <p className={styles.stepNumber}>STEP {String(index + 1).padStart(2, "0")}</p>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="testimonials" className={styles.section}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {stats.map((item) => (
              <article key={item.label} className={styles.statCard}>
                <p>{item.value}</p>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
          <div className={styles.sectionHead}>
            <h2>
              Loved by <span>food lovers</span>
            </h2>
          </div>
          <div className={styles.testimonialGrid}>
            {testimonials.map((item) => (
              <article key={`${item.name}-${item.city}`} className={styles.testimonialCard}>
                <p className={styles.starLine}>*****</p>
                <p className={styles.quote}>"{item.quote}"</p>
                <p className={styles.userLine}>
                  <strong>{item.name}</strong> - {item.city}
                </p>
                <p className={styles.cuisine}>{item.cuisine}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className={`${styles.section} ${styles.softSection}`}>
        <div className={styles.container}>
          <div className={styles.sectionHead}>
            <h2>Got questions?</h2>
            <p>We&apos;ve got answers. Here are the most common ones.</p>
          </div>
          <div className={styles.faqWrap}>
            {faqs.map((item) => (
              <details key={item.q} className={styles.faqItem}>
                <summary>{item.q}</summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.container}>
          <div className={styles.ctaPanel}>
            <h2>Your next meal is waiting.</h2>
            <p>Join 50,000+ food lovers who save money and eat fresher. No credit card required.</p>
            <div className={styles.heroActions}>
              <Link href="/login" className={styles.ctaPrimaryButton}>
                Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div>
              <div className={styles.brand}>
                <Image src="/assets/logo.jpg" alt="NearBite logo" width={34} height={34} className={styles.brandLogo} />
                <p>NearBite</p>
              </div>
              <p className={styles.footerText}>Fresh food, zero wait. The smarter way to eat from your local favorites.</p>
              <Link href="/login" className={styles.footerDownload}>
                Login
              </Link>
            </div>
            <div>
              <h4>Product</h4>
              <ul>
                <li>
                  <a href="#how-it-works">How it works</a>
                </li>
                <li>
                  <a href="#why-pickup">Why Pickup</a>
                </li>
                <li>
                  <Link href="/login">Login</Link>
                </li>
              </ul>
            </div>
            <div>
              <h4>Company</h4>
              <ul>
                <li>
                  <a href="#">About Us</a>
                </li>
                <li>
                  <a href="#">Blog</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
              </ul>
            </div>
            <div>
              <h4>Support</h4>
              <ul>
                <li>
                  <a href="#">Help Center</a>
                </li>
                <li>
                  <a href="#">Contact</a>
                </li>
                <li>
                  <a href="#">Privacy Policy</a>
                </li>
              </ul>
            </div>
          </div>
          <p className={styles.copyright}>(c) 2026 NearBite. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
