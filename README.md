# Glue Ops

## Description
This project aims at improving automation in GitOps by helping you make changes to git repositories and publish those changes as pull requests.


```
glue_ops <cmd> [args]

The glue for GitOps

Commands:
  glue-ops run       Applies file syncs and publishes repository changes
  glue-ops sync      Applies your file syncs
  glue-ops template  Prints your templated config file to STDOUT for debugging
                     purposes

Options:
      --help         Show help                                         [boolean]
      --version      Show version number                               [boolean]
  -c, --config-path  Sets the config path    [string] [default: "glue_ops.yaml"]
```
