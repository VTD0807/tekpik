import Head from 'next/head';
import styles from '@/styles/Privacy.module.css';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | TekPik</title>
        <meta
          name="description"
          content="Read TekPik's Privacy Policy. Learn how we collect, use, and protect your personal information when you visit our tech reviews website."
        />
        <meta property="og:title" content="Privacy Policy | TekPik" />
        <meta
          property="og:description"
          content="Learn how we handle your data and privacy"
        />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://tekpik.com/help/privacy" />
      </Head>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Privacy Policy</h1>
            <p>Last Updated: March 2026</p>
          </div>

          <div className={styles.content}>
            <section className={styles.section}>
              <h2>1. Overview</h2>
              <p>
                TekPik ("we," "us," "our," or "Company") is committed to protecting
                your privacy. This Privacy Policy explains how we collect, use, disclose,
                and otherwise handle your information when you visit our website
                (tekpik.com), including any other linked pages, features, and content
                (collectively, the "Service").
              </p>
              <p>
                Please read this Privacy Policy carefully. If you do not agree with our
                policies and practices, please do not use our Service.
              </p>
            </section>

            <section className={styles.section}>
              <h2>2. Information We Collect</h2>
              
              <h3>Information You Provide Directly:</h3>
              <ul>
                <li><strong>Contact Information:</strong> Name, email address when you subscribe to our newsletter or contact us</li>
                <li><strong>Review Data:</strong> Ratings, comments, and feedback when you submit reviews or comments</li>
                <li><strong>Communication Data:</strong> Your messages, questions, and inquiries sent through contact forms</li>
              </ul>

              <h3>Information Collected Automatically:</h3>
              <ul>
                <li><strong>Browser Information:</strong> Browser type, version, and language</li>
                <li><strong>Device Information:</strong> Device type, operating system, unique device identifiers</li>
                <li><strong>Usage Data:</strong> Pages visited, time spent, clicks, referral source</li>
                <li><strong>IP Address and Location:</strong> General geographic location based on IP</li>
                <li><strong>Cookies and Similar Technologies:</strong> Tracking pixels, local storage, and similar tracking technologies</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>3. How We Use Your Information</h2>
              <p>We use the information we collect for the following purposes:</p>
              <ul>
                <li>Providing, maintaining, and improving our Service</li>
                <li>Sending newsletter content and promotional materials (if you opt-in)</li>
                <li>Responding to your inquiries and customer support requests</li>
                <li>Analyzing usage patterns to enhance user experience</li>
                <li>Complying with legal obligations and enforcing our policies</li>
                <li>Detecting and preventing fraud or security issues</li>
                <li>Personalizing your experience on our Service</li>
                <li>Marketing and advertising purposes (with consent where required)</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>4. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our
                Service and hold certain information. You can instruct your browser to refuse
                all cookies or to indicate when a cookie is being sent. However, if you do not
                accept cookies, you may not be able to use some portions of our Service.
              </p>
              <p>
                We use analytics tools (such as Google Analytics) to understand how users
                interact with our Service. These tools may place cookies on your device.
              </p>
            </section>

            <section className={styles.section}>
              <h2>5. Third-Party Links and Affiliate Links</h2>
              <p>
                Our Service contains links to third-party websites and affiliate links to
                retailers (Amazon, Flipkart, etc.). We are not responsible for the privacy
                practices of these third-party sites. We encourage you to review the privacy
                policies of any third-party service before providing your information.
              </p>
              <p>
                When you click on affiliate links and make a purchase, we may earn a commission.
                This does not affect the price you pay. Please see our Disclaimer for more information.
              </p>
            </section>

            <section className={styles.section}>
              <h2>6. Information Sharing</h2>
              <p>
                We do not sell, trade, or rent your personally identifiable information to others.
                We may share your information in the following circumstances:
              </p>
              <ul>
                <li><strong>Service Providers:</strong> Third-party vendors who help us operate our website (hosting, analytics, email services)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In the event of merger, acquisition, or sale of assets</li>
                <li><strong>With Your Consent:</strong> For purposes you explicitly authorize</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>7. Data Security</h2>
              <p>
                We implement appropriate technical, administrative, and physical safeguards to
                protect your information against unauthorized access, alteration, disclosure,
                or destruction. However, no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className={styles.section}>
              <h2>8. Your Rights and Choices</h2>
              <ul>
                <li><strong>Opt-Out:</strong> You can unsubscribe from our newsletter at any time by clicking the unsubscribe link in emails</li>
                <li><strong>Access and Correction:</strong> You can request access to or correction of your personal information</li>
                <li><strong>Cookie Control:</strong> You can control cookies through your browser settings</li>
                <li><strong>GDPR and CCPA:</strong> If you are in the EU or California, you may have additional rights</li>
              </ul>
            </section>

            <section className={styles.section}>
              <h2>9. Children's Privacy</h2>
              <p>
                Our Service is not directed to children under the age of 13. We do not knowingly
                collect personal information from children under 13. If we become aware that a
                child under 13 has provided us with personal information, we will take steps to
                delete such information and terminate the child's account.
              </p>
            </section>

            <section className={styles.section}>
              <h2>10. International Data Transfers</h2>
              <p>
                Your information may be transferred to, stored in, and processed in countries
                other than your country of residence. These countries may have data protection
                laws that differ from your home country. By using our Service, you consent to
                the transfer of your information to countries outside your country of residence.
              </p>
            </section>

            <section className={styles.section}>
              <h2>11. Policy Updates</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our
                practices or applicable laws. We will notify you of any material changes by
                updating the "Last Updated" date and posting the new policy on our Service.
                Your continued use of the Service after such modifications constitutes your
                acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section className={styles.section}>
              <h2>12. Contact Us</h2>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy
                or our privacy practices, please contact us at:
              </p>
              <p>
                <strong>Email:</strong> privacy@tekpik.com<br />
                <strong>Mailing Address:</strong> Tech Review Platform<br />
                We will respond to your inquiry within 30 business days.
              </p>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}

export async function getStaticProps() {
  return {
    props: {},
    revalidate: 86400, // Revalidate once per day
  };
}
