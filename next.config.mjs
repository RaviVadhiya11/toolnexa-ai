/** @type {import('next').NextConfig} */
const nextConfig={
  poweredByHeader:false,
  async headers(){
    const common=[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
      {key:'X-Frame-Options',value:'DENY'},
      {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'}
    ];
    return [
      {source:'/:path*',headers:common},
      // Permit only the self-hosted, sandboxed reference Studio to appear in its parent workspace.
      {source:'/studio-passport-social-reference.html',headers:[
        {key:'X-Frame-Options',value:'SAMEORIGIN'},
        {key:'Content-Security-Policy',value:"frame-ancestors 'self'"}
      ]},
      {source:'/api/:path*',headers:[{key:'Cache-Control',value:'no-store'},{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
      {source:'/dashboard/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
      {source:'/admin/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
      {source:'/subscribe/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
      {source:'/auth/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]}
    ];
  }
};
export default nextConfig;
