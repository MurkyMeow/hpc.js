const foo_t = struct32({
  x: int8,
  y: int8,
  z: int8,
});

const example = foo_t({ x: 12, y: 24, z: 96 });

console.log(example.x);
console.log(example.y);
console.log(example.z);
