# TerraformJS

TerraformJS is a wrapper for [Terraform](https://www.terraform.io/) that allows you to write your configuration in JavaScript.

## Overview

You can write your Terraform configuration using JavaScript modules named with a `.tf.js` suffix, TerraformJS imports these modules and generates Terraform [JSON configuration](https://www.terraform.io/docs/configuration/syntax-json.html) files named with a `.tf.json` suffix.

Terraform loads these `.tf.json` files along with your `.tf` files, so you can use TerraformJS in your current Terraform project without changing anything at all, you can just add new `.tf.js` files for your configurations that need some programming features that don't exist in the [native Terraform language syntax](https://www.terraform.io/docs/configuration/syntax.html).

## Getting Started

1. Install TerraformJS globally:

```bash
npm install -g terraformjs
```

2. In a new directory or in your current Terraform project's directory, create a `package.json` file:

```bash
npm init -y
```

3. Open the `package.json` file and add a `type` field with the value of `module`:

```json
{
  "type": "module"
}
```

This is required for your `.js` files to be treated as ES modules by Node.js, because TerraformJS supports **ES modules** only and does not support CommonJS.

4. Start writing your Terraform configuration files with JavaScript in `.tf.js` files instead of the standard `.tf` files:

For example:

```javascript
import { provider, data, resource, output } from 'terraformjs';

// Configure the AWS provider
export const aws = provider.aws({
  version: '~> 2.0',
  region: 'us-west-2',
  profile: 'default'
});

// Create a data source for the Ubuntu AMI that will be used to create an EC2 instance
export const ubuntu = data.aws_ami.ubuntu({
  most_recent: true,

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

// Create an EC2 instance
export const instance = resource.aws_instance.web({
  // We can use the data source that we have defined earlier
  // Results in ${data.aws_ami.ubuntu.id}
  ami: ubuntu.id,
  instance_type: 't2.micro',

  tags: {
    Name: 'web'
  }
});

// Create an output value for the instance's public IP address
export const publicIP = output.instance_ip_address({
  // Results in ${aws_instance.web.public_ip}
  value: instance.public_ip
});
```
