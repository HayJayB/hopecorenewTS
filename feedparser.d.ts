declare module "feedparser" {
  import { EventEmitter } from "events";

  class FeedParser extends EventEmitter {
    constructor(options?: any);
    end(): void;
    write(chunk: any): void;
  }

  export default FeedParser;
}
