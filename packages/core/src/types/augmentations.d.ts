/**
 * This file provides type augmentations to fix build errors caused by
 * 'minizlib' v3 and 'tar' v7 requiring newer Node.js type definitions
 * than what is currently installed (@types/node@18).
 *
 * 1. 'minizlib' v3 references 'ZstdCompress' and 'ZstdDecompress' which
 *    were added in newer Node.js versions (or drafts) and are missing
 *    in @types/node@18.
 * 2. 'tar' v7 uses a generic 'Buffer<T>' type which was introduced in
 *    TypeScript 5.7+ / newer @types/node, but our environment sees
 *    'Buffer' as non-generic.
 */

// Ensure this file is treated as a module
export { };

// Fix for minizlib: "Namespace 'zlib' has no exported member 'ZstdCompress'"
declare module 'zlib' {
  interface ZstdCompress {
    // Minimal interface to satisfy the type checker
    close(): void;
  }
  interface ZstdDecompress {
    // Minimal interface to satisfy the type checker
    close(): void;
  }
}

// Fix for tar: "Type 'Buffer' is not generic."
// We need to make Buffer generic in the global scope to match what tar expects.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface, @typescript-eslint/no-explicit-any
  interface Buffer<T = any> extends Uint8Array {
    // This merges with the existing Buffer interface and adds the generic parameter
  }
}
