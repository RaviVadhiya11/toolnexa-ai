/**
 * The only canonical public site address. Legacy API/webhook routes continue to
 * answer on the Vercel hostname until payment providers are migrated separately.
 */
export const CANONICAL_SITE_URL='https://toolnexaai.com' as const;
export const LEGACY_SITE_HOST='toolnexa-ai.vercel.app' as const;

const providerOrInternalPath=/^\/(?:api|auth|_next|\.well-known)(?:\/|$)/;
const staticAssetPath=/\.(?:png|jpe?g|webp|gif|svg|ico|woff2?|css|js|map)$/i;

/** Only browser-facing document requests move to the canonical domain.
 * Preserve old API/webhook endpoints and OAuth confirmation callbacks.
 * Never redirect POST payment/webhook requests or static asset fetches.
 */
export function shouldRedirectLegacyPage(pathname:string,method:string){
 if(method!=='GET'&&method!=='HEAD')return false;
 if(providerOrInternalPath.test(pathname))return false;
 if(staticAssetPath.test(pathname))return false;
 if(['/favicon.ico','/studio-zip-maker.html','/studio-passport-social-reference.html'].includes(pathname))return false;
 return true;
}
