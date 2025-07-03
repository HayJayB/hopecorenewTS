declare module "feedparser" {
  import { EventEmitter } from "events";

  class FeedParser extends EventEmitter {
    constructor(options?: any);
    write(chunk: any): void;
    end(): void;
    // Add other members you need here
  }

  export default FeedParser;
}
