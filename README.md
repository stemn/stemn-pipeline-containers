# 📦 Stemn Pipeline Containers

Pre-packaged applications for use in Stemn Pipelines.

# Containers

[stemn/cadquery](./cadquery)

Processes CadQuery python scripts.

[stemn/email](./email)

Sends an email to a list of recipients with file attachments.

[stemn/upload](./upload)

Uploads pipeline outputs to Stemn.

# Environment Variables

All containers in a Stemn pipeline are supplied the following environment variables:

### `STEMN_PIPELINE_EVENT`

The event that caused the pipeline to be run. Can be `revision`, `commit`, or `release`.

### `STEMN_PIPELINE_ID`

The id of the pipeline.

### `STEMN_PIPELINE_ROOT`

The root directory of the pipeline data directory. Defaults to `/pipeline`.

### `STEMN_PIPELINE_TOKEN`

A token for authenticating to the Stemn API as a project user. The token is valid only for the duration of the pipeline.

### `STEMN_PIPELINE_TMP`

The directory used for storage of metadata about the pipeline (e.g. files create/changed during the pipeline). Defaults to `/pipeline/.stemn`.

### `STEMN_PIPELINE_UID_GID`

The [`uid` and `gid`](http://www.linfo.org/uid.html) of the user the container is executing as.

### `STEMN_PIPELINE_PARAMS`

Any parameters passed to the container using `params` will be supplied as environment variables with the prefix `STEMN_PIPELINE_PARAMS`. For example, `subject` will be `STEMN_PIPELINE_PARAMS_SUBJECT`.

# Conventions

## File Patterns

All parameters used for selecting files (e.g. [`attachments`](./email/#attachments), `inputFiles`, `files`) are processed by [micromatch](https://github.com/micromatch/micromatch) which provides wildcard support for selecting multiple files e.g. `gear/*.stl`.
