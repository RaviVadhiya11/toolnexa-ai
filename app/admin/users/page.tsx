import Link from 'next/link';
import {requireAdmin,adminDb} from '@/lib/admin';
export const dynamic='force-dynamic';
export default async function UsersPage({searchParams}:{searchParams:Promise<{page?:string}>}){
 await requireAdmin();
 const db=adminDb();
 const params=await searchParams;
 const page=Math.max(1,Math.min(10000,Number.parseInt(params.page||'1',10)||1));
 if(!db)return <section className="panel"><h1 className="text-2xl font-bold">User management</h1><p className="muted mt-3">Set the server-only SUPABASE_SERVICE_ROLE_KEY to view registered users.</p></section>;
 const {data,error}=await db.auth.admin.listUsers({page,perPage:25});
 if(error)return <section className="panel"><h1 className="text-2xl font-bold">User management</h1><p className="muted mt-3">Unable to load users. Check Supabase configuration.</p></section>;
 const users=data.users||[];
 return <section><div className="flex justify-between items-center gap-3"><div><p className="eyebrow muted">Management</p><h1 className="text-3xl font-extrabold">Registered users</h1><p className="muted mt-2">Read-only account directory • {data.total??users.length} total</p></div><Link className="button outline" href="/admin">Back to admin</Link></div>
 <div className="panel mt-5" style={{overflowX:'auto'}}><table style={{width:'100%',minWidth:580,textAlign:'left',borderCollapse:'collapse'}}><thead><tr><th style={{padding:12}}>Email</th><th style={{padding:12}}>Verified</th><th style={{padding:12}}>Joined</th><th style={{padding:12}}>Last sign in</th></tr></thead><tbody>{users.map(u=><tr key={u.id} style={{borderTop:'1px solid var(--border)'}}><td style={{padding:12}}>{u.email||'No email'}</td><td style={{padding:12}}>{u.email_confirmed_at?'Yes':'No'}</td><td style={{padding:12}}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td><td style={{padding:12}}>{u.last_sign_in_at?new Date(u.last_sign_in_at).toLocaleDateString('en-IN'):'Never'}</td></tr>)}</tbody></table>{users.length===0&&<p className="muted mt-3">No users found.</p>}</div>
 <div className="flex gap-3 mt-5">{page>1&&<Link className="button outline" href={`/admin/users?page=${page-1}`}>Previous</Link>}{users.length===25&&<Link className="button outline" href={`/admin/users?page=${page+1}`}>Next</Link>}</div>
 <p className="muted text-sm mt-4">Only authorized administrators can access this page. No passwords or authentication tokens are displayed.</p></section>;
}