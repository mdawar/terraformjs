import { BlockType } from './base.js' ;

// Top-level Terraform blocks
export const terraform = new BlockType('terraform');
export const provider = new BlockType('provider');
export const resource = new BlockType('resource');
export const variable = new BlockType('variable');
export const module = new BlockType('module');
export const data = new BlockType('data');
export const locals = new BlockType('locals');
export const output = new BlockType('output');
