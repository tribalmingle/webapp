declare module 'contentful' {
  export function createClient(...args: any[]): any
  export type EntrySkeletonType<T = any> = T
}
