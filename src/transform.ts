import { PluginObj, types as t } from "babel-core";

import {
  struct32_parse_decl,
  struct32_parse_instance,
  struct32_parse_member_offset,
  struct32_values_to_numeric,
} from "./struct32";

function transform(): PluginObj {
  return {
    visitor: {
      VariableDeclarator(path) {
        const struct = struct32_parse_decl(path);

        if (!struct) return;

        path.remove();

        const references = path.scope.bindings[struct.name].referencePaths;

        for (const reference of references) {
          const instance = struct32_parse_instance(reference);
          const numeric = struct32_values_to_numeric(instance.values);

          reference.parentPath.parentPath.replaceWith(
            t.variableDeclarator(
              t.identifier(instance.name),
              t.numericLiteral(numeric)
            )
          );

          const referenceReferences =
            reference.scope.bindings[instance.name].referencePaths;

          for (const {
            parentPath: referenceReference,
          } of referenceReferences) {
            if (!t.isMemberExpression(referenceReference.node)) {
              throw referenceReference.buildCodeFrameError(
                `Unknown struct reference`
              );
            }

            try {
              const offset = struct32_parse_member_offset(
                struct,
                referenceReference.node
              );

              referenceReference.replaceWith(
                t.binaryExpression(
                  "&",
                  t.binaryExpression(
                    ">>",
                    t.identifier(instance.name),
                    t.numericLiteral(offset.shift)
                  ),
                  t.numericLiteral(offset.mask)
                )
              );
            } catch (err) {
              throw referenceReference.buildCodeFrameError(err.message);
            }
          }
        }
      },
    },
  };
}

export default transform;
