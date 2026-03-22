import React, { useEffect, useState } from 'react';
import Head from 'next/head';

export default function AppDashboard() {
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(stat => {
            const finalCount = stat.getAttribute('data-count');
            if(finalCount) {
                let start = 0;
                const end = parseInt(finalCount, 10);
                if (isNaN(end)) return;
                const duration = 800;
                const stepTime = 20;
                const steps = duration / stepTime;
                const increment = end / steps;
                
                const timer = setInterval(() => {
                    start += increment;
                    if(start >= end) {
                        clearInterval(timer);
                        stat.innerText = new Intl.NumberFormat('en-IN').format(end); 
                    } else {
                        stat.innerText = Math.floor(start);
                    }
                }, stepTime);
            }
        });
    }, [activeTab]);

    return (
        <>
            <Head>
                <title>TekPik App - Dashboard</title>
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
                    --hover-state: #EFF6FF; 
                    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
                    --shadow-hover: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    --radius-card: 12px;
                    --radius-pill: 9999px;
                    --font-display: 'Syne', sans-serif;
                    --font-body: 'DM Sans', sans-serif;
                }

                * { box-sizing: border-box; margin: 0; padding: 0; }
                body {
                    font-family: var(--font-body);
                    background-color: var(--bg-body);
                    color: var(--text-dark);
                    font-size: 0.875rem;
                    line-height: 1.5;
                    display: flex;
                    height: 100vh;
                    overflow: hidden;
                }
                h1, h2, h3 { font-family: var(--font-display); color: var(--text-dark); }
                h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.03em; }
                h2 { font-size: 1.25rem; font-weight: 700; }
                a { text-decoration: none; color: inherit; }
                button { cursor: pointer; font-family: inherit; border: none; background: none; outline: none; }
                
                .app-layout { display: flex; width: 100%; height: 100vh; }
                
                .sidebar {
                    width: 260px; background-color: var(--bg-surface);
                    border-right: 1px solid var(--border-color); display: flex;
                    flex-direction: column; padding: 32px 24px; flex-shrink: 0; z-index: 10;
                }
                .logo {
                    font-family: var(--font-display); font-weight: 800; font-size: 2rem;
                    color: var(--text-dark); margin-bottom: 48px; letter-spacing: -0.05em;
                }
                .logo span { color: var(--color-primary); }
                .nav-menu { list-style: none; display: flex; flex-direction: column; gap: 4px; }
                .nav-item {
                    display: flex; align-items: center; padding: 10px 16px; border-radius: 8px;
                    color: var(--text-muted); font-weight: 500; transition: all 0.2s ease; cursor: pointer;
                }
                .nav-item:hover { background-color: var(--hover-state); color: var(--color-primary); }
                .nav-item.active { background-color: var(--hover-state); color: var(--color-primary); font-weight: 600; }
                
                .main-col { flex-grow: 1; display: flex; flex-direction: column; overflow: hidden; }
                
                .top-bar {
                    height: 80px; padding: 0 40px; display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
                }
                .search-container { position: relative; width: 320px; }
                .search-container input {
                    width: 100%; padding: 10px 16px 10px 40px; background-color: var(--bg-surface);
                    border: 1px solid var(--border-color); border-radius: var(--radius-pill); font-size: 0.875rem; color: var(--text-dark); transition: all 0.2s;
                }
                .search-container input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
                .search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
                .user-actions { display: flex; align-items: center; gap: 20px; }
                .avatar { width: 40px; height: 40px; border-radius: 50%; background-color: var(--text-dark); display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; }
                
                .page-content { flex-grow: 1; padding: 0 40px 40px 40px; overflow-y: auto; scroll-behavior: smooth; }
                .view-section { display: none; animation: fadeIn 0.2s ease forwards; }
                .view-section.active { display: block; }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

                .card { background-color: var(--bg-surface); border: 1px solid var(--border-color); border-radius: var(--radius-card); box-shadow: var(--shadow-sm); padding: 24px; }
                .card.hoverable { transition: all 0.2s ease; cursor: pointer; }
                .card.hoverable:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); border-color: var(--color-primary); }
                .btn { padding: 10px 20px; border-radius: 8px; font-weight: 500; font-size: 0.875rem; transition: all 0.15s ease; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
                .btn-primary { background-color: var(--text-dark); color: white; }
                .btn-primary:hover { background-color: black; }
                .btn-secondary { background-color: var(--bg-surface); border: 1px solid var(--border-color); color: var(--text-dark); }
                .btn-blue { background-color: var(--color-primary); color: white; }
                .btn-ghost { color: var(--text-dark); }
                
                .badge { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; display: inline-block; }
                .badge.blue { background-color: var(--hover-state); color: var(--color-primary); }
                .badge.dark { background-color: var(--border-color); color: var(--text-dark); }

                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
                .stat-value { font-family: var(--font-display); font-size: 2rem; font-weight: 800; margin-bottom: 4px; color: var(--text-dark); }
                .stat-label { color: var(--text-muted); font-size: 0.875rem; }
                .dash-columns { display: grid; grid-template-columns: 2fr 1fr; gap: 24px; }
                .list-row { display: flex; align-items: center; gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--border-color); }
                .list-row:last-child { border-bottom: none; }
                
                .filters { display: flex; gap: 12px; margin-bottom: 24px; overflow-x: auto; padding-bottom: 4px; }
                .filter-pill { padding: 8px 16px; border-radius: var(--radius-pill); border: 1px solid var(--border-color); color: var(--text-dark); cursor: pointer; font-weight: 500; transition: all 0.2s; }
                .filter-pill.active { background: var(--text-dark); color: white; border-color: var(--text-dark); }
                .product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .product-card { padding: 20px; display: flex; flex-direction: column; gap: 16px; justify-content: space-between; }
                .product-price { color: var(--text-dark); font-weight: 600; font-size: 1.2rem; }
                
                .compare-table { width: 100%; border-collapse: collapse; background: var(--bg-surface); border-radius: var(--radius-card); box-shadow: var(--shadow-sm); overflow: hidden; }
                .compare-table th, .compare-table td { padding: 20px; border-bottom: 1px solid var(--border-color); text-align: left; }
                .compare-table th { background: #F8FAFC; font-family: var(--font-display); font-size: 1.1rem; border-bottom: 2px solid var(--border-color); }
                
                .ai-chat-container { max-width: 700px; margin: 0 auto; display: flex; flex-direction: column; height: calc(100vh - 120px); }
                .chat-history { flex-grow: 1; overflow-y: auto; padding-bottom: 24px; display: flex; flex-direction: column; gap: 24px; }
                .chat-bubble { max-width: 85%; padding: 16px 20px; border-radius: 12px; line-height: 1.5; }
                .chat-user { background: var(--color-primary); color: white; align-self: flex-end; border-bottom-right-radius: 4px; }
                .chat-ai { background: var(--bg-surface); border: 1px solid var(--border-color); align-self: flex-start; border-bottom-left-radius: 4px; }
                .ai-input-bar { display: flex; gap: 12px; background: var(--bg-surface); padding: 12px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); }
                .ai-input-bar input { flex-grow: 1; border: none; outline: none; background: transparent; font-family: inherit; font-size: 1rem; padding-left: 8px; }
                
                .data-table { width: 100%; border-collapse: collapse; }
                .data-table th, .data-table td { padding: 16px; border-bottom: 1px solid var(--border-color); text-align: left; }
                .data-table th { color: var(--text-muted); font-weight: 500; font-size: 0.85rem; }
                
                .blog-hero { position: relative; height: 320px; border-radius: var(--radius-card); background: var(--border-color); margin-bottom: 32px; display: flex; align-items: flex-end; padding: 32px; }
                .blog-hero-content { background: var(--bg-surface); padding: 24px; border-radius: 8px; max-width: 600px; box-shadow: var(--shadow-sm); }
                .blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
                .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-top: 12px; }

                @media (max-width: 768px) {
                    body { overflow: auto; }
                    .app-layout { flex-direction: column; height: auto; min-height: 100vh; }
                    .sidebar { width: 100%; height: auto; border-right: none; border-bottom: 1px solid var(--border-color); padding: 16px; }
                    .nav-menu { flex-direction: row; overflow-x: auto; padding-bottom: 8px; }
                    .nav-item { white-space: nowrap; }
                    .logo { margin-bottom: 16px; font-size: 1.5rem; }
                    .top-bar { height: 60px; padding: 0 16px; }
                    .page-content { padding: 0 16px 24px 16px; overflow-y: visible; }
                    .stats-grid, .dash-columns, .product-grid, .blog-grid { grid-template-columns: 1fr; gap: 16px; }
                    .search-container { width: 100%; margin-right: 16px; }
                }
            `}} />

            <div className="app-layout">
                <aside className="sidebar">
                    <div className="logo">tekpik<span>&bull;</span></div>
                    <ul className="nav-menu">
                        {['dashboard', 'products', 'compare', 'ai-recommender', 'links', 'blog', 'settings'].map(tab => (
                            <li 
                                key={tab}
                                className={`nav-item ${activeTab === tab ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </li>
                        ))}
                    </ul>
                    <div style={{ marginTop: 'auto', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
                        <a href="/help" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Legal & T&C</a>
                    </div>
                </aside>

                <div className="main-col">
                    <header className="top-bar">
                        <div className="search-container">
                            <span className="search-icon">🔍</span>
                            <input type="text" placeholder="Search..." />
                        </div>
                        <div className="user-actions">
                            <span style={{ color: 'var(--text-muted)', cursor: 'pointer' }}>🔔</span>
                            <div className="avatar">T</div>
                        </div>
                    </header>

                    <div className="page-content">
                        <section className={`view-section ${activeTab === 'dashboard' ? 'active' : ''}`}>
                            <div className="page-header">
                                <h1>Overview</h1>
                                <button className="btn btn-secondary">Export Data</button>
                            </div>
                            
                            <div className="stats-grid">
                                <div className="card">
                                    <div className="stat-label">Total Clicks</div>
                                    <div className="stat-value" data-count="12450">12,450</div>
                                    <div style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 500 }}>+12% this week</div>
                                </div>
                                <div className="card">
                                    <div className="stat-label">Earnings</div>
                                    <div className="stat-value" data-count="3240">₹3,240</div>
                                    <div style={{ color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 500 }}>+8% this week</div>
                                </div>
                                <div className="card">
                                    <div className="stat-label">Products Listed</div>
                                    <div className="stat-value" data-count="148">148</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Updated today</div>
                                </div>
                                <div className="card">
                                    <div className="stat-label">Active Links</div>
                                    <div className="stat-value" data-count="89">89</div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 500 }}>Stable</div>
                                </div>
                            </div>

                            <div className="dash-columns">
                                <div className="card">
                                    <h2 style={{ marginBottom: '24px' }}>Top Products</h2>
                                    <div className="list-row">
                                        <div style={{ flexGrow: 1 }}>
                                            <div style={{ fontWeight: 600 }}>Sony WH-1000XM5</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Headphones</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600 }}>3,421 clicks</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>₹450 earned</div>
                                        </div>
                                    </div>
                                    <div className="list-row">
                                        <div style={{ flexGrow: 1 }}>
                                            <div style={{ fontWeight: 600 }}>iPhone 15 Pro Max</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Smartphones</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 600 }}>2,100 clicks</div>
                                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>₹890 earned</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="card">
                                    <h2 style={{ marginBottom: '24px' }}>Activity</h2>
                                    <div className="list-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>Generated summary for "MacBook Air"</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>2 hours ago</div>
                                    </div>
                                    <div className="list-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-dark)' }}>New affiliate link created</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>5 hours ago</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className={`view-section ${activeTab === 'products' ? 'active' : ''}`}>
                            <div className="page-header">
                                <h1>Product Listings</h1>
                                <button className="btn btn-primary">Add Product</button>
                            </div>
                            <div className="filters">
                                <div className="filter-pill active">All Categories</div>
                                <div className="filter-pill">Smartphones</div>
                                <div className="filter-pill">Laptops</div>
                                <div className="filter-pill">Audio</div>
                            </div>
                            <div className="product-grid">
                                <div className="card product-card hoverable">
                                    <div className="product-info">
                                        <span className="badge dark" style={{ marginBottom: '12px' }}>Audio</span>
                                        <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Sony WH-1000XM5</h3>
                                        <div className="product-price">₹29,990</div>
                                    </div>
                                    <button className="btn btn-secondary" style={{ width: '100%' }}>Get Link</button>
                                </div>
                                <div className="card product-card hoverable">
                                    <div className="product-info">
                                        <span className="badge dark" style={{ marginBottom: '12px' }}>Laptops</span>
                                        <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>MacBook Air M2</h3>
                                        <div className="product-price">₹1,14,900</div>
                                    </div>
                                    <button className="btn btn-secondary" style={{ width: '100%' }}>Get Link</button>
                                </div>
                                <div className="card product-card hoverable">
                                    <div className="product-info">
                                        <span className="badge dark" style={{ marginBottom: '12px' }}>Smartphones</span>
                                        <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Samsung Galaxy S24 Ultra</h3>
                                        <div className="product-price">₹1,29,999</div>
                                    </div>
                                    <button className="btn btn-secondary" style={{ width: '100%' }}>Get Link</button>
                                </div>
                            </div>
                        </section>

                        <section className={`view-section ${activeTab === 'compare' ? 'active' : ''}`}>
                            <div className="page-header">
                                <h1>Compare</h1>
                                <button className="btn btn-secondary">Clear All</button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="compare-table">
                                    <thead>
                                        <tr>
                                            <th>Features</th>
                                            <th>Sony WH-1000XM5</th>
                                            <th>Bose QC Ultra <span className="badge blue" style={{ marginLeft: '8px' }}>Best Pick</span></th>
                                            <th>AirPods Max</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ fontWeight: 500, color: 'var(--text-muted)' }}>ANC Quality</td>
                                            <td>Excellent</td>
                                            <td style={{ fontWeight: 600 }}>Unmatched</td>
                                            <td>Very Good</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Battery Life</td>
                                            <td>30 Hours</td>
                                            <td style={{ fontWeight: 600 }}>24 Hours</td>
                                            <td>20 Hours</td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 500, color: 'var(--text-muted)' }}>Price (INR)</td>
                                            <td>₹29,990</td>
                                            <td style={{ fontWeight: 600 }}>₹25,900</td>
                                            <td>₹59,900</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className={`view-section ${activeTab === 'ai-recommender' ? 'active' : ''}`}>
                            <div className="ai-chat-container">
                                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                                    <h1>AI Assistant</h1>
                                    <p style={{ color: 'var(--text-muted)' }}>Ask for recommendations or specs.</p>
                                </div>
                                <div className="chat-history">
                                    <div className="chat-bubble chat-user">
                                        I need a good laptop for coding under ₹80,000.
                                    </div>
                                    <div className="chat-bubble chat-ai">
                                        Based on your ₹80k budget for coding, the <strong>Lenovo IdeaPad Slim 5</strong> is my top recommendation.
                                        <div className="card hoverable" style={{ marginTop: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontWeight: 600 }}>Lenovo IdeaPad Slim 5</div>
                                                <div className="product-price" style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>₹76,990</div>
                                            </div>
                                            <button className="btn btn-secondary">Details</button>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="ai-input-bar">
                                        <input type="text" placeholder="Type what you need..." />
                                        <button className="btn btn-primary" style={{ height: '36px', borderRadius: '8px' }}>Send</button>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className={`view-section ${activeTab === 'links' ? 'active' : ''}`}>
                            <div className="page-header">
                                <h1>Link Manager</h1>
                                <button className="btn btn-primary">New Link</button>
                            </div>
                            <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Affiliate Link</th>
                                            <th>Clicks</th>
                                            <th>Earnings</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td style={{ fontWeight: 500 }}>Sony WH-1000XM5</td>
                                            <td><a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>amzn.to/3z5P</a></td>
                                            <td>3,421</td>
                                            <td>₹450</td>
                                            <td><span className="badge blue">Active</span></td>
                                        </tr>
                                        <tr>
                                            <td style={{ fontWeight: 500 }}>Logitech MX Master 3S</td>
                                            <td><a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>amzn.to/8kLp</a></td>
                                            <td>1,204</td>
                                            <td>₹180</td>
                                            <td><span className="badge dark">Paused</span></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <section className={`view-section ${activeTab === 'blog' ? 'active' : ''}`}>
                            <div className="page-header">
                                <h1>Blog</h1>
                                <button className="btn btn-primary">New Post</button>
                            </div>
                            <div className="blog-hero">
                                <div className="blog-hero-content">
                                    <span className="badge dark">Featured</span>
                                    <h2 style={{ fontSize: '1.5rem', margin: '12px 0' }}>The State of Foldable Phones 2026</h2>
                                    <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Are we ready to ditch the slab phone? We tested the top 5 foldables.</p>
                                    <button className="btn btn-secondary">Read Article</button>
                                </div>
                            </div>
                            <div className="blog-grid">
                                <div className="card hoverable">
                                    <h3 style={{ marginBottom: '8px', fontSize: '1.1rem' }}>Nothing Ear (a) Review</h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>Style over substance or true audio quality?</p>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Oct 12</span>
                                </div>
                            </div>
                        </section>

                        <section className={`view-section ${activeTab === 'settings' ? 'active' : ''}`}>
                            <div className="page-header">
                                <h1>Settings</h1>
                            </div>
                            <div className="card">
                                <p style={{ color: 'var(--text-muted)' }}>Application preferences and general settings.</p>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </>
    );
}

AppDashboard.getLayout = function getLayout(page) {
    return page;
};
