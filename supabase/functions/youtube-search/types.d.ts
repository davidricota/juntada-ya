declare global {
  namespace Deno {
    interface Env {
      readonly YOUTUBE_API_KEY: string;
    }
  }
}

export {};
