/** @type {import('next').NextConfig} */
const nextConfig={
  poweredByHeader:false,
  async headers(){
    const common=[
      {key:'X-Content-Type-Options',value:'nosniff'},
      {key:'Referrer-Policy',value:'strict-origin-when-cross-origin'},
      {key:'X-Frame-Options',value:'DENY'},
      {key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=(), payment=(self)'}
    ];
    return [
      {source:'/:path*',headers:common},
      {source:'/api/:path*',headers:[{key:'Cache-Control',value:'no-store'},{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
      {source:'/dashboard/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
      {source:'/admin/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
      {source:'/subscribe/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]},
      {source:'/auth/:path*',headers:[{key:'X-Robots-Tag',value:'noindex, nofollow'}]}
    ];
  }
};
export default nextConfig;
