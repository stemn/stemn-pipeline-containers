# 📤 Upload

Uploads pipeline outputs to Stemn.

Files are uploaded to the same location as created in the pipeline.

# Sample Configuration

```
$schema: https://schemas.stemn.com/pipeline+v1

label: Convert gear

triggers:
- files: gear/*.sldprt
  type: commit

stages:
- label: Generate CAD Models
  steps:
  - label: STEP format
    image: stemn/cadquery:latest
    inputFiles:
    - resin-mould.py
    command: ['build', '--in_spec', 'resin-mould.py', '--format', 'STEP']
- label: Upload pipeline outputs
  steps:
  - label: Upload to Stemn
    image: stemn/upload:latest
    inputFiles:
    - cqobject*
```
