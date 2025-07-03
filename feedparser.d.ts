declare module "feedparser" {
  import { EventEmitter } from "events";

  interface Enclosure {
    url?: string;
    type?: string;
  }

  interface Item {
    title?: string;
    description?: string;
    summary?: string;
    link?: string;
    pubDate?: Date;
    date?: Date;
    image?: { url?: string };
    enclosures?: Enclosure[];
  }

  class FeedParser extends EventEmitter {
    constructor(options?: any);
    // Note: the stream pipeline will .pipe() into this
    end(): void;
    write(chunk: any): void;
    read(): Item | null;
  }

  export = FeedParser;
}
