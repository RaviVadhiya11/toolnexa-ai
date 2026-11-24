export const YOUTUBE_THUMB_QUALITIES=[
 {id:'maxresdefault',label:'Max HD',hint:'Best available',minWidth:900},
 {id:'sddefault',label:'Standard HD',hint:'Standard',minWidth:600},
 {id:'hqdefault',label:'High Quality',hint:'HQ',minWidth:450},
 {id:'mqdefault',label:'Medium',hint:'MQ',minWidth:300},
 {id:'default',label:'Small',hint:'Original small',minWidth:100}
] as const;

export type YoutubeThumbQuality=(typeof YOUTUBE_THUMB_QUALITIES)[number]['id'];
export type YoutubeThumbOption={quality:YoutubeThumbQuality;label:string;width:number;height:number};
export function isYoutubeVideoId(input:unknown):input is string{
 return typeof input==='string'&&/^[a-zA-Z0-9_-]{11}$/.test(input);
}
export function isYoutubeQuality(input:unknown):input is YoutubeThumbQuality{
 return typeof input==='string'&&YOUTUBE_THUMB_QUALITIES.some(q=>q.id===input);
}
export function youtubeThumbnailUrl(id:string,quality:YoutubeThumbQuality):string{
 return '/api/youtube-thumbnail?videoId='+encodeURIComponent(id)+'&quality='+encodeURIComponent(quality);
}
