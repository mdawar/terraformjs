# TerraformJS

TerraformJS is a wrapper for [Terraform](https://www.terraform.io/) that allows you to write your infrastructure configurations in JavaScript.

## Requirements

- **Node.js** 13.2.0+ (With ES modules enabled by default)
- **Terraform** 0.12+

## Overview

You can write your Terraform configuration using JavaScript modules named with a `.tf.js` suffix, TerraformJS imports these modules and generates Terraform [JSON configuration](https://www.terraform.io/docs/configuration/syntax-json.html) files named with a `.tf.json` suffix.

Terraform loads these `.tf.json` files along with your `.tf` files, so you can use TerraformJS in your current Terraform project without changing anything at all, you can just add new `.tf.js` files for your configurations that need some programming features that don't exist in the [native Terraform language syntax](https://www.terraform.io/docs/configuration/syntax.html).

## Why?

- Write your infrastructure configuration files in a language you already know
- Use programming features that are not available in Terraform's language syntax (HCL)
- Import your configuration data from databases, files or any other source

## Features

- Drop in replacement command for the `terraform` CLI
- Small API and easy to learn (Only top-level blocks are pre-defined everything else is dynamic)
- Can be used in an existing Terraform project without any changes, you can use both JavaScript configuration files `.tf.js` and Terraform's configuration language files `.tf` in the same project

## How it works?

When you use the `terraformjs` command instead of `terraform`:

1. The previously generated `.tf.json` files are removed if any
2. The `.tf.js` files are imported and the exports are used to generate the `.tf.json` files
3. Terraform is executed with any passed command line arguments
4. After Terraform's execution is complete all the generated `.tf.json` files are removed

## Getting Started

1. Install TerraformJS globally to be able to execute it from any directory:

```bash
npm install -g terraformjs
```

Optional: You can alias `terraform` to `terraformjs` by adding this line `alias terraform="terraformjs"` to `~/.bash_aliases` or `~/.bashrc`.

2. In a new directory or in your current Terraform project's directory, create a `package.json` file:

```bash
npm init -y
```

3. Install `terraformjs` to be able to import it in your modules:

```bash
npm install terraformjs
```

4. Open the `package.json` file and add a `type` field with the value of `module`:

```json
{
  "type": "module"
}
```

This is required for your `.js` files to be treated as ES modules by Node.js, because TerraformJS supports **ES modules** only and does not support CommonJS.

5. Start writing your Terraform configuration files with JavaScript in `.tf.js` files instead of the standard `.tf` files, then you can use `terraformjs` instead of `terraform` to manage your infrastructure

## Write your infrastructure configuration in JavaScript

All the top-level Terraform blocks are defined and can imported from `terraformjs` package:
- `terraform`
- `provider`
- `resource`
- `variable`
- `module`
- `data`
- `locals`
- `output`

```javascript
// import the needed top-level blocks
import { provider, resource, variable, data, output } from 'terraformjs';
```

To define the block labels, you can chain as many properties as needed:

```javascript
// Chain an "aws" property to define the provider label
provider.aws

// You can chain any number of properties as they are dynamically handled
resource.aws_instance.web
data.aws_ami.debian
```

To define the block body you can call the last chained property with an object:

```javascript
import { provider, data, resource, output } from 'terraformjs';

// You must export the defined blocks so terraformjs can import them and generate the JSON file
// The export names do not matter, they can be used in other defined blocks to reference another block
export const aws = provider.aws({
  // Define any supported arguments
  region: 'us-east-1'
});

// To define a block with an empty body you must call the last property
export const aws = provider.aws() // An empty object is the default

export const awsWest = provider.aws({
  alias: 'west',
  region: 'us-east-1',
  profile: 'default'
});

// Create a data source for the Ubuntu AMI that will be used to create an EC2 instance
export const ubuntu = data.aws_ami.ubuntu({
  most_recent: true,

  // When multiple nested blocks of the same type can be given
  // an array can be used to define these nested blocks
  filter: [
    {
      name: 'name',
      values: ['ubuntu/images/hvm-ssd/ubuntu-trusty-14.04-amd64-server-*']
    },
    {
      name: 'virtualization-type',
      values: ['hvm']
    }
  ],

  owners: ['099720109477']
});

// Define a resource
export const instance = resource.aws_instance.web({
  // Example of referencing another defined block
  // This will be translated to "aws.west"
  provider: awsWest,

  // We can use the data source that we have defined earlier
  // Results in ${data.aws_ami.ubuntu.id}
  ami: ubuntu.id,

  instance_type = 't2.micro',

  tags: {
    Name: 'web'
  },

  // When the nested block type requires one or more labels
  // an array of objects can be used
  provisoner: [
    {
      // provisioner "local-exec" {}
      'local-exec': {
        command: 'echo "Hello World" > example.txt'
      }
    },
    {
      // provisioner "remote-exec" {}
      'remote-exec': {
        inline: ['sudo install-something -f /tmp/example.txt']
      }
    }
  ]
});

// Create an output value for the instance's public IP address
export const publicIP = output.instance_ip_address({
  // Results in ${aws_instance.web.public_ip}
  value: instance.public_ip
});
```

Another example exporting multiple blocks using arrays:

```javascript
import { provider, data, resource, output } from 'terraformjs';

// Set the variable value in *.tfvars file
// or using -var="do_token=..." CLI option
export const token = variable.do_token();

// Configure the DigitalOcean Provider
export const doProvider = provider.digitalocean({
  // Translates to ${var.do_token}
  // Same as token: token
  token
});

// List of droplets
export const droplets = [];
// Droplets IPv4 addresses
export const ipAddresses = [];

// This is just an example using an array of numbers
// You can pull the data from anywhere, databases, files...
for (const n of [1, 2, 3, 4]) {
  const droplet = resource.digitalocean_droplet[`web-${n}`]({
    provider: doProvider,
    image: 'ubuntu-18-04-x64',
    name: `web-${n}`,
    region: 'nyc2',
    size: 's-1vcpu-1gb'
  });

  droplets.push(droplet);

  const ip = output[`web-${n}`]({
    value: droplet.ipv4_address
  });

  ipAddresses.push(ip);
}
```

Nested arrays of any number of levels deep are also supported, so for the above example you can also export 1 array:

```javascript
// List of droplets
const droplets = [];
// Droplets IPv4 addresses
const ipAddresses = [];

export const all = [
  // Nested arrays
  droplets,
  ipAddresses
];
```
