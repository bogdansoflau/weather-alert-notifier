import NodeCache from "node-cache";

export const cache = new NodeCache({ stdTTL: 600 /* seconds, i.e. 10m */ });
