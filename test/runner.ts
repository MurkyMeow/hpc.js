import fs from "fs";
import path from "path";
import * as babel from "babel-core";
import transform from "../src/transform";

const input = path.join(__dirname, "test.js");
const output = path.join(__dirname, "output.js");

fs.readFile(input, function (err, data) {
  if (err) throw err;

  const source = data.toString();

  const out = babel.transform(source, {
    plugins: [transform],
  });

  fs.writeFileSync(output, out.code || "");
});
