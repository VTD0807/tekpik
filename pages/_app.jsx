import '@/styles/globals.css';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

import Head from 'next/head';

function MyApp({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => (
    <>
      <Nav />
      {page}
      <Footer />
    </>
  ));

  return (
    <>
      <Head>
        <title>TekPik • Smart Gadget Reviews & Affiliates</title>
        <link rel="icon" href="https://ooqens.web.app/OQENS-CLOUD/TEKPIK-CLOUD/MEDIA/TEKPIK-LOGO.png" />
        <meta name="description" content="TekPik — The ultimate smart tech gadget review and unbiased affiliate marketing platform. Discover the best tech deals, professional reviews, and AI-driven recommendations tailored for you." />
        <meta property="og:title" content="TekPik • Smart Gadget Reviews & Affiliates" />
        <meta property="og:description" content="TekPik — The ultimate smart tech gadget review and unbiased affiliate marketing platform. Discover the best tech deals, professional reviews, and AI-driven recommendations tailored for you." />
        <meta property="og:image" content="https://ooqens.web.app/OQENS-CLOUD/TEKPIK-CLOUD/MEDIA/TEKPIK-LOGO.png" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="TekPik" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="TekPik • Smart Gadget Reviews & Affiliates" />
        <meta name="twitter:description" content="TekPik — The ultimate smart tech gadget review and unbiased affiliate marketing platform. Discover the best tech deals, professional reviews, and AI-driven recommendations tailored for you." />
        <meta name="twitter:image" content="https://ooqens.web.app/OQENS-CLOUD/TEKPIK-CLOUD/MEDIA/TEKPIK-LOGO.png" />
      </Head>
      {getLayout(<Component {...pageProps} />)}
    </>
  );
}

export default MyApp;
