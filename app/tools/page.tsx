import {Suspense} from 'react';import {ToolList} from '@/components/tool-list';
export default function ToolsPage(){return <><h1 className="text-3xl font-extrabold">All Tools</h1><p className="muted mt-2">Explore 20 free tools. Choose a category or search for a tool.</p><Suspense fallback={<div className="panel mt-5">Loading tools…</div>}><ToolList/></Suspense></>}
