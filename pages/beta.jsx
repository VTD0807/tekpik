import React, { useState } from 'react';
import Head from 'next/head';

export default function BetaWaitlist() {
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        
        const form = e.target;
        const formData = new FormData(form);
        const scriptURL = 'https://script.google.com/macros/s/AKfycbxygi6mWKjqcjTbf_m7UnmwnmLVwqxQOzn02aTr7OmybOrvI1dYAys_WyziKEY_t1K4kA/exec';

        if (scriptURL === '<YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL>') {
            // Mock submission
            setTimeout(() => {
                setStatus('success');
            }, 1000);
            return;
        }

        try {
            await fetch(scriptURL, { 
                method: 'POST', 
                body: formData 
            });
            setStatus('success');
        } catch (error) {
            console.error('Error!', error.message);
            setStatus('error');
            alert('There was an issue submitting your request. Please try again.');
        }
    };

    return (
        <>
            <Head>
                <title>TekPik Beta Waitlist</title>
                <meta name="description" content="Join the exclusive TekPik beta waitlist." />
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
                    --font-display: 'Syne', sans-serif;
                    --font-body: 'DM Sans', sans-serif;
                    --radius-input: 8px;
                    --radius-card: 16px;
                }

                * { box-sizing: border-box; margin: 0; padding: 0; }
                
                body {
                    font-family: var(--font-body);
                    background-color: var(--bg-body);
                    color: var(--text-dark);
                    font-size: 1rem;
                    line-height: 1.5;
                }

                .layout-wrapper {
                    display: flex;
                    flex-direction: column;
                    min-height: 100vh;
                }

                h1, h2 { font-family: var(--font-display); color: var(--text-dark); }
                h1 { font-size: 2.5rem; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 12px; }
                
                header {
                    padding: 24px 40px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    background-color: transparent;
                }

                .logo {
                    font-family: var(--font-display);
                    font-weight: 800;
                    font-size: 2rem;
                    color: var(--text-dark);
                    text-decoration: none;
                    letter-spacing: -0.05em;
                }
                .logo span { color: var(--color-primary); }

                main {
                    flex-grow: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px 20px;
                }

                .waitlist-card {
                    background-color: var(--bg-surface);
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-card);
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
                    padding: 48px;
                    width: 100%;
                    max-width: 500px;
                    text-align: center;
                }

                .waitlist-subtitle {
                    color: var(--text-muted);
                    margin-bottom: 32px;
                    font-size: 1.05rem;
                }

                .form-group {
                    margin-bottom: 20px;
                    text-align: left;
                }

                .form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    font-size: 0.9rem;
                    color: var(--text-dark);
                }

                .form-group input {
                    width: 100%;
                    padding: 14px 16px;
                    border: 1px solid var(--border-color);
                    border-radius: var(--radius-input);
                    font-family: inherit;
                    font-size: 1rem;
                    color: var(--text-dark);
                    background-color: var(--bg-body);
                    transition: all 0.2s;
                }

                .form-group input:focus {
                    outline: none;
                    border-color: var(--color-primary);
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
                    background-color: var(--bg-surface);
                }

                .btn-submit {
                    width: 100%;
                    padding: 16px;
                    background-color: var(--color-primary);
                    color: white;
                    border: none;
                    border-radius: var(--radius-input);
                    font-size: 1.1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: opacity 0.2s;
                    margin-top: 12px;
                    font-family: var(--font-body);
                }

                .btn-submit:hover { opacity: 0.9; }
                .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

                .success-state {
                    text-align: center;
                    padding: 24px 0;
                }
                
                .success-icon {
                    font-size: 4rem;
                    color: var(--color-primary);
                    margin-bottom: 16px;
                }
                
                @media (max-width: 768px) {
                    header { padding: 16px; }
                    main { padding: 20px 10px; }
                    .waitlist-card { padding: 32px 20px; }
                    h1 { font-size: 2rem; }
                }
            `}} />

            <div className="layout-wrapper">
                <header>
                    <a href="/" className="logo">tekpik<span>&bull;</span></a>
                </header>

                <main>
                    <div className="waitlist-card">
                        {status === 'success' ? (
                            <div className="success-state">
                                <div className="success-icon">✓</div>
                                <h2>You're on the list!</h2>
                                <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>
                                    Keep an eye on your inbox for early access invites.
                                </p>
                            </div>
                        ) : (
                            <>
                                <h1>Join the Beta</h1>
                                <p className="waitlist-subtitle">Be the first to access our new platform.</p>
                                
                                <form onSubmit={handleSubmit} name="google-sheet-form">
                                    <div className="form-group">
                                        <label htmlFor="name">Full Name</label>
                                        <input type="text" id="name" name="Name" placeholder="Enter your name" required />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="email">Email Address</label>
                                        <input type="email" id="email" name="Email" placeholder="you@example.com" required />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="phone">Phone Number</label>
                                        <input type="tel" id="phone" name="Phone" placeholder="+91 xxxxx xxxxx" required />
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        className="btn-submit" 
                                        disabled={status === 'loading'}
                                    >
                                        {status === 'loading' ? 'Submitting...' : 'Join Waitlist'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}

BetaWaitlist.getLayout = function getLayout(page) {
  return page;
};
