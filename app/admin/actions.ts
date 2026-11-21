'use server';
import {revalidatePath} from 'next/cache';
import {requireAdmin,adminDb} from '@/lib/admin';
import {tools} from '@/lib/tools';
export async function setToolEnabled(formData:FormData){
 await requireAdmin();
 const db=adminDb();
 if(!db)throw new Error('Admin database is not configured');
 const slug=String(formData.get('slug')||'');
 const enabled=formData.get('enabled')==='true';
 if(!tools.some(t=>t.slug===slug))throw new Error('Invalid tool');
 const {error}=await db.from('tool_settings').upsert({slug,enabled,updated_at:new Date().toISOString()},{onConflict:'slug'});
 if(error)throw new Error('Unable to update tool settings');
 revalidatePath('/admin');revalidatePath('/tools');revalidatePath('/');
}
