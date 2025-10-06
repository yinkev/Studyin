declare module 'animejs' {
  const anime: {
    (params?: Record<string, any>): any;
    timeline(params?: Record<string, any>): any;
    stagger(value: number | string, options?: Record<string, any>): any;
  };
  export default anime;
}
