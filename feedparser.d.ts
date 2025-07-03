declare module "feedparser" {
  import { EventEmitter } from "events";
  import { Writable } from "stream";

  export interface FeedItem {
    title?: string;
    description?: string;
    summary?: string;
    link?: string;
    pubDate?: Date;
    date?: Date;
    image?: { url?: string };
    enclosures?: { url?: string; type?: string }[];
  }

  class FeedParser extends EventEmitter implements Writable {
    constructor(options?: any);
    end(): void;
    write(chunk: any): void;
    read(): FeedItem | null;
  }

  export = FeedParser;
}
