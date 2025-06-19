// src/setupTests.ts

// 1) jest-dom matchers
import "@testing-library/jest-dom";

// 2) bring in Node’s TextEncoder/TextDecoder
import {
  TextEncoder as NodeTextEncoder,
  TextDecoder as NodeTextDecoder,
} from "util";

// 3) only define them if they’re missing in jsdom:
if (!("TextEncoder" in globalThis)) {
  globalThis.TextEncoder = NodeTextEncoder;
}

if (!("TextDecoder" in globalThis)) {
  // @ts-expect-error Node’s TextDecoder matches the DOM interface in jsdom
  globalThis.TextDecoder = NodeTextDecoder;
}
