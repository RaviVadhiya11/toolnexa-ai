import {serverSupabase} from '@/lib/supabase/server';
import {createClient} from '@supabase/supabase-js';
export async function requireAdmin(){
 const auth=await serverSupabase();
 if(!auth)throw new Error('Authentication not configured');
 const {data:{user},error}=await auth.auth.getUser();
 const admins=(process.env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
 if(error||!user?.email||!admins.includes(user.email.toLowerCase()))throw new Error('Unauthorized');
 return user;
}
export function adminDb(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)return null;
 return createClient(url,key,{auth:{autoRefreshToken:false,persistSession:false}});
}
