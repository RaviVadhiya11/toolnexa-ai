/** Transfer an uploaded File between client-side Next.js routes without
 * uploading it to a server or writing sensitive image data to storage. */
let pendingUpload:File|null=null;
export function prepareStudioUpload(file:File){pendingUpload=file;}
export function takeStudioUpload(){const file=pendingUpload;pendingUpload=null;return file;}
