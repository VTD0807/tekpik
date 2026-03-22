import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en-IN">
      <Head>
        <meta charSet="UTF-8" />
        <meta name="description" content="TekPik publishes expert tech gadget reviews, buying guides, and curated deals for Indian shoppers. Compare products faster and buy smarter." />
        <meta name="keywords" content="tech gadgets india, best budget gadgets, tech reviews india, amazon gadgets, budget earphones, smartphone accessories india" />
        <meta name="author" content="TekPik" />
        <meta name="robots" content="index, follow" />
        <meta name="theme-color" content="#f9fafb" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <link rel="canonical" href="https://tekpik.in/" />

        {/* Open Graph */}
        <meta property="og:title" content="TekPik | Tech Gadget Reviews, Buying Guides and Deals in India" />
        <meta property="og:description" content="TekPik publishes expert tech gadget reviews, buying guides, and curated deals for Indian shoppers." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://tekpik.in/" />
        <meta property="og:site_name" content="TekPik" />
        <meta property="og:locale" content="en_IN" />
        <meta property="og:image" content="https://tekpik.in/og-image.jpg" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TekPik | Tech Gadget Reviews and Deals in India" />
        <meta name="twitter:description" content="Compare top gadgets, read honest reviews, and discover curated deals for Indian buyers." />
        <meta name="twitter:image" content="https://tekpik.in/og-image.jpg" />

        {/* Preconnect fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet" />

        {/* Schema.org Structured Data */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                "name": "TekPik",
                "url": "https://tekpik.in/",
                "logo": "https://tekpik.in/og-image.jpg",
                "description": "Independent tech gadget reviews and buying guides for Indian users."
              },
              {
                "@type": "WebSite",
                "name": "TekPik",
                "url": "https://tekpik.in/",
                "description": "Smart tech gadget reviews and buying guides for India"
              }
            ]
          })
        }} />
      </Head>
      <body>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
