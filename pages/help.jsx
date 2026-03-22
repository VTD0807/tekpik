import React from 'react';
import Head from 'next/head';

export default function HelpPage() {
    return (
        <>
            <Head>
                <title>TekPik Legal & Help - Terms and Conditions</title>
                <meta name="description" content="Read the Terms and Conditions, Privacy Policy, and legal terms for using TekPik, the smart tech gadget review and affiliate marketing platform." />
                <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap" rel="stylesheet" />
            </Head>
            
            <style dangerouslySetInnerHTML={{__html: `
                :root {
                    --bg-body: #F8FAFC; 
                    --bg-surface: #FFFFFF;
                    --text-dark: #0F172A;
                    --text-muted: #64748B;
                    --color-primary: #3B82F6;
                    --border-color: #E2E8F0;
                }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: 'DM Sans', sans-serif;
                    background-color: var(--bg-body);
                    color: var(--text-dark);
                    line-height: 1.6;
                }
                h1, h2, h3 { font-family: 'Syne', sans-serif; }
                header {
                    background: var(--bg-surface);
                    padding: 24px 40px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .logo {
                    font-family: 'Syne', sans-serif;
                    font-weight: 800;
                    font-size: 1.5rem;
                    color: var(--text-dark);
                    text-decoration: none;
                    letter-spacing: -0.05em;
                }
                .logo span { color: var(--color-primary); }
                main {
                    max-width: 800px;
                    margin: 40px auto;
                    background: var(--bg-surface);
                    padding: 40px;
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
                }
                h1 { font-size: 2rem; margin-bottom: 24px; letter-spacing: -0.03em; }
                h2 { font-size: 1.25rem; margin-top: 32px; margin-bottom: 16px; font-weight: 700; }
                p { margin-bottom: 16px; color: var(--text-muted); }
                
                @media (max-width: 768px) {
                    header { padding: 16px; flex-direction: column; gap: 12px; }
                    main { margin: 20px 10px; padding: 24px 16px; }
                    h1 { font-size: 1.5rem; margin-bottom: 16px; }
                }
            `}} />

            <header>
                <a href="/" className="logo">tekpik<span>&bull;</span></a>
                <nav>
                    <a href="/app" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600 }}>Go to App</a>
                </nav>
            </header>
            
            <main>
                <h1>Terms & Conditions</h1>
                <p>Last updated: October 2026</p>
                
                <h2>1. Introduction</h2>
                <p>Welcome to TekPik. By accessing our platform, you agree to these legal terms. We aim to provide unbiased tech gadget reviews and fair affiliate marketing practices.</p>
                
                <h2>2. Affiliate Disclosures</h2>
                <p>TekPik participates in various affiliate marketing programs. We may earn commissions on purchases made through our links, at no extra cost to you.</p>

                <h2>3. User Responsibilities</h2>
                <p>Users are expected to engage respectfully on our platform. Abuse, spamming, or fraudulent use of the AI Recommender or Affiliate Manager will result in account termination.</p>

                <h2>4. Privacy Policy</h2>
                <p>We respect your privacy. All telemetry, analytics, and personal data are strictly regulated. We do not sell your personal data.</p>
            </main>
        </>
    );
}

HelpPage.getLayout = function getLayout(page) {
    return page;
};
