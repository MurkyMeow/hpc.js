# hpc.js

A js preprocessor that utilizes a type system to make the code as performant and efficient as possible.

## struct32

A struct that takes only 32 bits of memory and is very fast to index.

Input:

```js
const foo_t = struct32({
  x: int8,
  y: int8,
  z: int8,
});

const example = foo_t({ x: 12, y: 24, z: 96 });

console.log(example.x);
console.log(example.y);
console.log(example.z);
```

Output:

```js
const example = 6297612;

console.log(example >> 0 & 255);
console.log(example >> 8 & 255);
console.log(example >> 16 & 255);
```
