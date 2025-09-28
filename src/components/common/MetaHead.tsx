import { Helmet } from 'react-helmet-async';
import type { SEOMetadata } from '@/types/openGraph';

interface MetaHeadProps {
  /** SEO and OpenGraph metadata */
  metadata: SEOMetadata;
  /** Additional custom meta tags */
  customMeta?: Array<{ name?: string; property?: string; content: string }>;
}

/**
 * Dynamic meta tags component using react-helmet-async
 * Handles OpenGraph, Twitter Cards, and standard SEO meta tags
 */
export function MetaHead({ metadata, customMeta = [] }: MetaHeadProps) {
  if (!metadata) {
    return null;
  }

  const {
    title,
    description,
    type = 'website',
    url,
    image,
    siteName,
    locale = 'en_US',
    twitter,
    keywords,
    author,
    publishedTime,
    modifiedTime
  } = metadata;

  return (
    <Helmet>
      {/* Standard meta tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}
      {url && <link rel="canonical" href={url} />}

      {/* OpenGraph meta tags */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      {siteName && <meta property="og:site_name" content={siteName} />}
      <meta property="og:locale" content={locale} />
      
      {/* OpenGraph image */}
      {image && (
        <>
          <meta property="og:image" content={image.url} />
          {image.width && <meta property="og:image:width" content={image.width.toString()} />}
          {image.height && <meta property="og:image:height" content={image.height.toString()} />}
          {image.alt && <meta property="og:image:alt" content={image.alt} />}
          {image.type && <meta property="og:image:type" content={image.type} />}
        </>
      )}

      {/* Article-specific meta tags */}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}

      {/* Twitter Card meta tags */}
      {twitter && (
        <>
          <meta name="twitter:card" content={twitter.card || 'summary_large_image'} />
          {twitter.site && <meta name="twitter:site" content={twitter.site} />}
          {twitter.creator && <meta name="twitter:creator" content={twitter.creator} />}
          <meta name="twitter:title" content={twitter.title || title} />
          <meta name="twitter:description" content={twitter.description || description} />
          {twitter.image && <meta name="twitter:image" content={twitter.image} />}
          {twitter.imageAlt && <meta name="twitter:image:alt" content={twitter.imageAlt} />}
        </>
      )}

      {/* Custom meta tags */}
      {customMeta.map((meta, index) => (
        <meta
          key={index}
          {...(meta.name ? { name: meta.name } : { property: meta.property })}
          content={meta.content}
        />
      ))}
    </Helmet>
  );
}