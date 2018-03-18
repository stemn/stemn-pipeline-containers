# ⚙️ CadQuery

Processes [CadQuery](https://github.com/dcowden/cadquery) python scripts.

# Sample Configuration

```
$schema: https://schemas.stemn.com/pipeline+v1

label: Convert gear

triggers:
- files: resin-mould.py
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
    files:
    - cqobject*
```
