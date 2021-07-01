import { types as t } from "babel-core";
import { NodePath } from "babel-traverse";

export const enum IntrinsicType {
  int8 = "int8",
}

const TYPE_SIZE = {
  int8: 8,
};

export type Struct32FMembers = { [key: string]: IntrinsicType };

export interface Struct32Decl {
  name: string;
  members: Struct32FMembers;
}

export function struct32_parse_decl(
  path: NodePath<t.VariableDeclarator>
): Struct32Decl | null {
  const STRUCT_32_DECL = "struct32";

  const { id, init } = path.node;

  if (
    t.isIdentifier(id) &&
    t.isCallExpression(init) &&
    t.isIdentifier(init.callee) &&
    init.callee.name === STRUCT_32_DECL
  ) {
    if (init.arguments.length !== 1) {
      throw path.buildCodeFrameError(`struct32 expects 1 argument`);
    }

    const argument = init.arguments[0];

    if (!t.isObjectExpression(argument)) {
      throw path.buildCodeFrameError(`struct32 expects an object`);
    }

    const members: Struct32FMembers = {};

    for (const prop of argument.properties) {
      if (
        !t.isObjectProperty(prop) ||
        !t.isIdentifier(prop.key) ||
        !t.isIdentifier(prop.value)
      ) {
        throw path.buildCodeFrameError(
          `struct32 can only be declared with a statically known list of properties`
        );
      }
      const key = prop.key.name;
      const value = prop.value.name;

      if (value !== IntrinsicType.int8) {
        throw path.buildCodeFrameError(`Unknown type: ${value}`);
      }

      members[key] = value;
    }

    return {
      name: id.name,
      members: members,
    };
  }

  return null;
}

export type Struct32Values = { [key: string]: number };

export function struct32_values_to_numeric(values: Struct32Values): number {
  let result = 0;

  Object.keys(values).forEach((key, i) => {
    result |= values[key] << (8 * i);
  });

  return result;
}

export interface Struct32Instance {
  name: string;
  values: Struct32Values;
}

export function struct32_parse_instance(node: NodePath): Struct32Instance {
  const call = node.parentPath;
  const variable = call.parentPath;

  if (!t.isVariableDeclarator(variable.node)) {
    throw variable.buildCodeFrameError(
      `A struct can only be used for variable declaration`
    );
  }
  if (!t.isIdentifier(variable.node.id)) {
    throw variable.buildCodeFrameError(`Unsupported variable identifier`);
  }
  if (!t.isCallExpression(call.node)) {
    throw call.buildCodeFrameError(`struct32 can only be called`);
  }
  if (
    call.node.arguments.length !== 1 ||
    !t.isObjectExpression(call.node.arguments[0])
  ) {
    throw call.buildCodeFrameError(`struct32 expects an object expression`);
  }

  const argument = call.node.arguments[0];
  const values: Struct32Values = {};

  for (const prop of argument.properties) {
    if (!t.isObjectProperty(prop) || !t.isIdentifier(prop.key)) {
      throw call.buildCodeFrameError(
        `struct32 can only be declared with a statically known list of properties`
      );
    }

    if (!t.isNumericLiteral(prop.value)) {
      throw call.buildCodeFrameError(
        `${prop.value.type} is not assignable to number`
      );
    }

    values[prop.key.name] = prop.value.value;
  }

  return {
    name: variable.node.id.name,
    values,
  };
}

export interface Sturct32MemberOffset {
  mask: number;
  shift: number;
}

export function struct32_parse_member_offset(
  struct: Struct32Decl,
  node: t.MemberExpression
): Sturct32MemberOffset {
  if (!t.isIdentifier(node.property)) {
    throw Error(`Invalid struct member access`);
  }

  const member_name = node.property.name;
  const member_size = TYPE_SIZE[struct.members[member_name]];

  if (!member_size) {
    throw Error(`"${member_name}" does not exist on type "${struct.name}"`);
  }

  let shift = 0;
  const keys = Object.keys(struct.members);

  for (let i = 0; i < keys.length; ++i) {
    const key = keys[i];
    const type = struct.members[key];
    const size = TYPE_SIZE[type];
    if (member_name === key) break;
    shift += size;
  }

  return {
    mask: 2 ** member_size - 1,
    shift,
  };
}
