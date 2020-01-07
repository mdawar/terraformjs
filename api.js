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
  constructor(type, labels, body) {
    this._type = type;
    this._labels = labels;
    this._body = body;

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

    switch (this._type) {
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
        parts.push(this._type);
        break;
    }

    parts.push(...this._labels);

    if (this._type === 'provider') {
      if (this._body && this._body.alias) {
        parts.push(this._body.alias);
      } else if (prop == 'alias') {
        // Return the <PROVIDER>.default if the alias is requested
        parts.push('default');
      }
    }

    // Provider reference expressions are not wrapped in ${}
    if (this._type === 'provider') {
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
