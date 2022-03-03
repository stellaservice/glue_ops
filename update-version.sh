#!/bin/bash
set -eu

new_version=$1

if [[ ! $new_version =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo 'Invalid version, must follow format: x.x.x'
  exit 1
fi

glue_ops sync -c ./update_version.glueops.yaml -r version=$new_version

git commit -am "Update version to: $new_version"
git push
git tag v$new_version
git push origin v$new_version
