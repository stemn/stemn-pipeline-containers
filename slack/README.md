# 📮 Email

Sends an email to a list of recipients with file attachments.

# Input Parameters

#### `to`

A list of email addresses to send to.

#### `subject`

The subject of the email.

#### `body`

The body content of the email.

#### `attachments`

The files to attach to the email.

# Sample Configuration

```
$schema: https://schemas.stemn.com/pipeline+v1

label: Email updates when a new version of the gear is released

triggers:
- files: gear/*.sldasm
  type: release

- label: Notify
  steps:
  - label: Send email to clients
    image: stemn/email:latest
    inputFiles:
    - gear/*
    params:
      to:
      - david@stemn.com
      - jackson@stemn.com
      subject: New Gear Assembly
      body: The latest version of the gear assembly is attached to this email.
      attachments: gear/*
```
