declare module "@netlify/edge-functions" {
  export interface Context {
    ip: string;
    env: {
      get(key: string): Promise<string | null>;
      put(key: string, value: string, options?: { ttl?: number }): Promise<void>;
    };
    next(): Promise<Response>;
  }
} 