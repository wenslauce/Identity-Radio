import { Helmet } from 'react-helmet-async';

interface SEOProps {
	title?: string;
	description?: string;
	image?: string;
	url?: string;
}

export const SEO = ({ 
	title = "Identity Radio - Live Music Streaming",
	description = "Listen to the best music on Identity Radio. Join our live chat community and request your favorite songs.",
	image = "/Logo darkk.png",
	url = window.location.href 
}: SEOProps) => {
	const siteTitle = title.includes("Identity Radio") ? title : `${title} | Identity Radio`;
	
	return (
		<Helmet>
			{/* Basic Meta Tags */}
			<title>{siteTitle}</title>
			<meta name="description" content={description} />
			<link rel="canonical" href={url} />

			{/* Open Graph / Facebook */}
			<meta property="og:type" content="website" />
			<meta property="og:url" content={url} />
			<meta property="og:title" content={siteTitle} />
			<meta property="og:description" content={description} />
			<meta property="og:image" content={image} />

			{/* Twitter */}
			<meta name="twitter:card" content="summary_large_image" />
			<meta name="twitter:url" content={url} />
			<meta name="twitter:title" content={siteTitle} />
			<meta name="twitter:description" content={description} />
			<meta name="twitter:image" content={image} />

			{/* Additional Meta Tags */}
			<meta name="theme-color" content="#7c3aed" />
			<meta name="apple-mobile-web-app-capable" content="yes" />
			<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
		</Helmet>
	);
};