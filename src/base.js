/**
 * Global symbols used to identify the Terraform block parts.
 *
 * @type {symbol}
 */
export const TYPE = Symbol.for('type');
export const LABELS = Symbol.for('labels');
export const BODY = Symbol.for('body');

/**
 * Class respresenting the interpolation syntax in Terraform.
 * The interpolations are wrapped in ${}, such as ${var.foo}.
 *
 * @see {@link https://www.terraform.io/docs/configuration/expressions.html#references-to-named-values|References to Named Values}
 */
export class Interpolation {
  /**
   * Creates an instance of Interpolation.
   *
   * @param {string} expression - Terraform named value expression
   * @returns {Proxy} Proxy object that handles dynamic property access
   */
  constructor(expression) {
    this.expression = expression;

    return new Proxy(this, {
      // When accessing a non existent property return a new interpolation object
      get(target, property) {
        if (property in target) {
          return target[property];
        }

        // property is a Symbol
        const prop = property.toString();
        const isIndex = !isNaN(Number(prop));

        let newExpression;

        if (isIndex) {
          newExpression = `${target.expression}[${prop}]`;
        } else {
          newExpression = `${target.expression}.${prop}`;
        }

        return new Interpolation(newExpression);
      }
    });
  }

  /**
   * Returns the Terraform expression wrapped in ${}.
   */
  toString() {
    return `\${${this.expression}}`;
  }

  toJSON() {
    return this.toString();
  }

  [Symbol.toPrimitive]() {
    return this.toString();
  }
}

/**
 * Class representing a Terraform block of any type.
 *
 * @see {@link https://www.terraform.io/docs/configuration/syntax.html#blocks|Blocks}
 */
export class Block {
  /**
   * Creates an instance of Block.
   *
   * @param {string} type - Block type (resource, variable, provider, data...)
   * @param {string[]} labels - Block labels
   * @param {Object} body - Block body
   * @returns {Proxy} Proxy object that handles dynamic property access
   */
  constructor(type, labels = [], body = {}) {
    this[TYPE] = type;
    this[LABELS] = labels;
    this[BODY] = body;

    return new Proxy(this, {
      // Handle access to non existent properties
      get(target, property) {
        // If the property already exists return it
        if (property in target) {
          return target[property];
        }

        return target.getExpression(property.toString());
      }
    });
  }

  /**
   * Returns the Terraform reference expression of the Block instance.
   *
   * @param {string} prop - Dynamic property accessed on the Block instance
   * @returns {(string|Interpolation)} Expression string for provider blocks or an Interpolation object
   */
  getExpression(prop) {
    const parts = [];

    switch (this[TYPE]) {
      // Types that are omitted from the beginning of the expression
      case 'resource':
      case 'provider':
        break;

      case 'variable':
        parts.push('var');
        break;

      case 'locals':
        parts.push('local');
        break;

      default:
        parts.push(this[TYPE]);
        break;
    }

    parts.push(...this[LABELS]);

    if (this[TYPE] === 'provider') {
      if (this[BODY] && this[BODY].alias) {
        parts.push(this[BODY].alias);
      } else if (prop == 'alias') {
        // Return the <PROVIDER>.default if the alias is requested
        parts.push('default');
      }
    }

    // Provider reference expressions are not wrapped in ${}
    if (this[TYPE] === 'provider') {
      return parts.join('.');
    } else {
      if (prop) {
        parts.push(prop);
      }

      return new Interpolation(parts.join('.'));
    }
  }

  toString() {
    return String(this.getExpression());
  }

  // Called by JSON.stringify
  toJSON() {
    return this.toString();
  }

  [Symbol.toPrimitive]() {
    return this.toString();
  }
}

/**
 * Class used to create custom callable objects.
 *
 * Subclasses must define a __call__ method that will be called when an instance is called.
 *
 * @see {@link https://stackoverflow.com/a/40878674/1209328|Extend Function}
 */
export class CallableObject extends Function {
  constructor() {
    // Support calling the instance
    super('...args', 'return this.__self__.__call__(...args)');

    const self = this.bind(this);
    this.__self__ = self;

    return self;
  }
}

/**
 * Class representing a Block instance builder.
 *
 * These instances handle chaining properties to set the block labels
 * and support setting the block body by calling the last chained label.
 */
export class BlockContent extends CallableObject {
  /**
   * Creates a BlockContent instance.
   *
   * @param {string} type - The type of the block to create
   * @param {string} label - The first block label
   * @returns {Proxy} Proxy object that handles dynamic property access
   */
  constructor(type, label) {
    super();

    this[TYPE] = type;
    this[LABELS] = label ? [label] : [];

    return new Proxy(this, {
      // Handle chaining labels
      get(target, property) {
        if (property in target) {
          return target[property];
        }

        // Add the chained label to the labels list
        target[LABELS].push(property.toString());

        // Return a proxy to the same object with the new labels
        // and the same handlers (this refers to the handler object)
        return new Proxy(target, this);
      }
    });
  }

  /**
   * Handles calling the instances of this class to create a Block instance.
   *
   * @param {object} body - Object of the configuration arguments of the block
   * @returns {Block} Block object
   */
  __call__(body = {}) {
    return new Block(this[TYPE], this[LABELS], body);
  }
}

/**
 * Class representing a Terraform top-level block.
 *
 * These blocks support chaining properties to set the block labels
 * and calling to provide the block body.
 *
 * @see {@link https://www.terraform.io/docs/configuration/syntax.html#blocks|Blocks}
 */
export class TerraformBlock extends CallableObject {
  /**
   * Creates a TerraformBlock instance.
   *
   * @param {string} type - Top level block type
   * @returns {Proxy} Proxy object that handles dynamic property access
   */
  constructor(type) {
    super();

    this[TYPE] = type;

    return new Proxy(this, {
      // Handle dynamic property access
      get(target, property) {
        if (property in target) {
          return target[property];
        }

        // Return an object that handles creating a new Block instance
        return new BlockContent(target[TYPE], property.toString());
      }
    });
  }

  /**
   * Handle calling top-level blocks without any labels to create a Block instance.
   *
   * @param {object} body - Object of the configuration arguments of the block
   * @returns {Block} Block object
   */
  __call__(body = {}) {
    // Pass an empty labels array
    return new Block(this[TYPE], [], body);
  }
}
