import Link from 'next/link';
import {requireAdmin,adminDb} from '@/lib/admin';
export const dynamic='force-dynamic';
export default async function AnalyticsPage(){
 await requireAdmin();
 const db=adminDb();
 if(!db)return <section className="panel"><h1 className="text-2xl font-bold">Tool analytics</h1><p className="muted mt-3">Set the server-only SUPABASE_SERVICE_ROLE_KEY to read aggregate usage.</p></section>;
 const {data,error}=await db.from('tool_usage_daily').select('day,slug,uses').order('day',{ascending:false}).limit(1000);
 if(error)return <section className="panel"><h1 className="text-2xl font-bold">Tool analytics</h1><p className="muted mt-3">Usage table is unavailable. Apply the Phase 3 database migration.</p></section>;
 const rows=data||[];
 const totals=new Map<string,number>();
 const days=new Map<string,number>();
 for(const r of rows){const count=Number(r.uses)||0;totals.set(r.slug,(totals.get(r.slug)||0)+count);days.set(r.day,(days.get(r.day)||0)+count)}
 const today=new Date().toISOString().slice(0,10);const cutoff=(n:number)=>{const d=new Date();d.setUTCDate(d.getUTCDate()-(n-1));return d.toISOString().slice(0,10)};const last7=rows.filter(r=>r.day>=cutoff(7)&&r.day<=today).reduce((n,r)=>n+Number(r.uses||0),0);const last30=rows.filter(r=>r.day>=cutoff(30)&&r.day<=today).reduce((n,r)=>n+Number(r.uses||0),0);
 const top=[...totals.entries()].sort((a,b)=>b[1]-a[1]);
 const recent=[...days.entries()].sort((a,b)=>b[0].localeCompare(a[0])).slice(0,14);
 return <section><div className="flex justify-between items-center gap-3"><div><p className="eyebrow muted">Analytics</p><h1 className="text-3xl font-extrabold">Tool usage</h1><p className="muted mt-2">Aggregated usage from Supabase</p></div><Link className="button outline" href="/admin">Back to admin</Link></div>
 <div className="stats mt-5"><div className="stat"><strong>{rows.reduce((n,r)=>n+(Number(r.uses)||0),0)}</strong><span className="muted text-sm">Recorded uses (loaded rows)</span></div><div className="stat"><strong>{top.length}</strong><span className="muted text-sm">Tools with usage</span></div><div className="stat"><strong>{days.size}</strong><span className="muted text-sm">Days with records</span></div></div>
 <div className="stats mt-5"><div className="stat"><strong>{last7}</strong><span className="muted text-sm">Last 7 days (UTC)</span></div><div className="stat"><strong>{last30}</strong><span className="muted text-sm">Last 30 days (UTC)</span></div></div><div className="admin-grid mt-5"><div className="panel"><h2 className="text-xl font-bold">Most used tools</h2>{top.length?top.map(([slug,uses])=><div key={slug} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)'}}><span>{slug}</span><strong>{uses}</strong></div>):<p className="muted mt-3">No usage events recorded yet.</p>}</div><div className="panel"><h2 className="text-xl font-bold">Recent daily usage</h2>{recent.length?recent.map(([day,uses])=><div key={day} style={{display:'flex',justifyContent:'space-between',gap:12,padding:'12px 0',borderBottom:'1px solid var(--border)'}}><span>{day}</span><strong>{uses}</strong></div>):<p className="muted mt-3">Daily data will appear once usage tracking is connected.</p>}</div></div>
 <p className="muted text-sm mt-4">This page displays successful tool runs recorded after Phase 5 is deployed and its SQL function is installed. All totals are based on the latest 1,000 loaded database rows; they are not all-time totals if more rows exist. Usage is aggregated by UTC day and tool; no user identity is stored.</p></section>;
}