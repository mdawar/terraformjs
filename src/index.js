import { TerraformBlock } from './base.js';

// Top-level Terraform blocks
export const terraform = new TerraformBlock('terraform');
export const provider = new TerraformBlock('provider');
export const resource = new TerraformBlock('resource');
export const variable = new TerraformBlock('variable');
export const module = new TerraformBlock('module');
export const data = new TerraformBlock('data');
export const locals = new TerraformBlock('locals');
export const output = new TerraformBlock('output');
