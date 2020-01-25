# TerraformJS

TerraformJS is a wrapper for [Terraform](https://www.terraform.io/) that allows you to write your infrastructure configurations in JavaScript.

## Requirements

- **Node.js** (With ES modules support) (Tested on 13.2.0+)
- **Terraform** 0.12+

**Note**: This package was only tested on Linux, it should work just fine on macOS.

## Overview

You can write your Terraform configuration using JavaScript modules named with a `.tf.js` suffix, TerraformJS imports these modules and generates Terraform [JSON configuration](https://www.terraform.io/docs/configuration/syntax-json.html) files named with a `.tf.json` suffix.

Terraform loads these `.tf.json` files along with your `.tf` files, so you can use TerraformJS in your current Terraform project without changing anything at all, you can just add new `.tf.js` files for your configurations that need some programming features that don't exist in the [native Terraform language syntax](https://www.terraform.io/docs/configuration/syntax.html).

## Why?

- Write your infrastructure configuration files in a language you already know
- Use programming features that are not available in Terraform's language syntax (HCL)
- Import your configuration data from databases, files or any other source

This project was inspired by [pretf](https://github.com/raymondbutcher/pretf), a similar tool but for Python.

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

All the command line arguments that you pass to `terraformjs` will be passed to `terraform`, with the exception of one command specific to `terraformjs` used to generate the JSON files without executing `terraform`:

```bash
# Generate the JSON files (*.tf.json) without executing Terraform
terraformjs generate
```

The configuration code is not checked for correctness, to validate your code use `terraformjs validate`.

## Getting Started

1. Install TerraformJS globally to be able to execute it from any directory:

```bash
npm i -g @mdawar/terraformjs
```

**Optional**: You can alias `terraform` to `terraformjs` by adding this line `alias terraform="terraformjs"` to `~/.bash_aliases` or `~/.bashrc`.

2. In a new directory or in your current Terraform project's directory, create a `package.json` file:

```bash
npm init -y
```

3. Install `terraformjs` to be able to import it in your modules:

```bash
npm i @mdawar/terraformjs
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

All the top-level Terraform blocks are defined and can imported from the `terraformjs` package:

- `terraform`
- `provider`
- `resource`
- `variable`
- `module`
- `data`
- `locals`
- `output`

```javascript
// Import the needed top-level blocks
import {
  provider,
  resource,
  variable,
  data,
  output
} from '@mdawar/terraformjs';
```

To define the block labels, you can chain as many properties as needed:

```javascript
// Chain an "aws" property to define the provider label
provider.aws;

// You can chain any number of properties as they are dynamically handled
resource.aws_instance.web;
data.aws_ami.debian;

// If the label is dynamic you can use the square brackets []
output[`dynamic-value-${n}`];
```

To define the block body you can call the last chained property with an **object** or a **function** that returns an object:

```javascript
import {
  terraform,
  provider,
  variable,
  data,
  resource,
  output
} from '@mdawar/terraformjs';

// You must export the defined blocks so terraformjs can import them and generate the JSON file
// The export names do not matter, they can be used as values in the body of other blocks

// The terraform top-level block does not have any labels so it can be called directly to define the body
export const tf = terraform({
  // Define any supported arguments
  required_version: '>= 0.12',

  // When a nested block requires a label
  // The label can be nested in an object
  backend: {
    // Defines the "backend s3 {}" block
    s3: {
      profile: 'default',
      bucket: 'BUCKET_NAME',
      region: 'us-east-1'
    }
  }
});

// To define a block with an empty body you must call the last property
// Set the variable value in *.tfvars file
// or using -var="aws_instance_type=..." CLI option
export const instance_type = variable.aws_instance_type(); // An empty object {} is the default body

export const aws = provider.aws({
  region: 'us-west-1',
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
  provider: aws,

  // We can use the data source that we have defined earlier
  // Results in ${data.aws_ami.ubuntu.id}
  ami: ubuntu.id,

  // Use the value of the variable defined above
  // Results in ${var.aws_instance_type}
  instance_type,

  tags: {
    Name: 'web'
  },

  // When the nested block type requires one or more labels
  // an array of objects can be used
  provisioner: [
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
import { provider, variable, resource, output } from '@mdawar/terraformjs';

// Define a variable
// Set the variable value in *.tfvars file
// or using -var="do_token=..." CLI option
export const token = variable.do_token();

// Configure the DigitalOcean Provider
export const doProvider = provider.digitalocean({
  // Translates to ${var.do_token}
  // Same as token: token
  token,
  version: '~> 1.9'
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

  // Define an output block with a dynamic label using square brakctes []
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
  // Nested array
  droplets,
  // You can nest arrays of any levels deep
  [ipAddresses]
];
```

Example of using an `async` function as the block body:

```javascript
// In this example we configure an **S3** bucket to respond to requests coming from CloudFlare proxy IP addresses only
// This is used when hosting a static website using CloudFlare and AWS S3
import axios from 'axios';
import { provider, resource } from '@mdawar/terraformjs';

export const aws = provider.aws({
  version: '~> 2.45',
  profile: 'default',
  region: 'us-east-1'
});

// Static site name, to be used as the S3 bucket name
const siteName = 'example.com';

// Using an async function as the block body instead of an object
// A function that returns a Promise that resolves to an object can be used instead
export const bucket = resource.aws_s3_bucket.website(async () => {
  // Get the Cloudflare proxy IP addresses
  // See: https://www.cloudflare.com/ips/
  let [ipv4, ipv6] = await Promise.all([
    axios.get('https://www.cloudflare.com/ips-v4'),
    axios.get('https://www.cloudflare.com/ips-v6')
  ]);

  ipv4 = ipv4.data.trim().split('\n');
  ipv6 = ipv6.data.trim().split('\n');

  const ips = [...ipv4, ...ipv6];

  // Returning an object to be used as the block body
  return {
    bucket: siteName,
    region: 'us-east-1',
    acl: 'public-read',

    website: {
      index_document: 'index.html',
      error_document: '404.html'
    },

    // We want to configure the bucket policy to allow Cloudflare proxy IP addresses only
    policy: `{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::${siteName}/*",
                "Condition": {
                  "IpAddress": {
                      "aws:SourceIp": ${JSON.stringify(ips)}
                  }
                }
            }
        ]
    }`,

    tags: {
      Name: siteName,
      Environment: 'Production'
    }
  };
});
```
