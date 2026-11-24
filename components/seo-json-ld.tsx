/** JSON-LD with safe output escaping to preserve script element boundaries. */
export function SeoJsonLd({data}:{data:Record<string,unknown>}){
 return <script type="application/ld+json"
  dangerouslySetInnerHTML={{__html:JSON.stringify(data).replace(/</g,'\\u003c')}}/>;
}
