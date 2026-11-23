export const studioRunSlugs=[
 'studio-vector','studio-image-to-vector','studio-convert','studio-svg-editor',
 'studio-enhance','studio-background','studio-retouch','studio-restore'
] as const;
export type StudioRunSlug=typeof studioRunSlugs[number];
