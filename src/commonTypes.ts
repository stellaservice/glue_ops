export interface Job {
  name: string
  fileSyncs: string[]
  branch: string
  approval: {
    enabled: boolean
  }
  merge: {
    method: 'squash' | 'merge'
    pollPrTimeout: number
    hooks: string[]
  }
}

export interface FileSyncType {
  type: 'yaml' | 'json' | 'regex'
  target: string[] | string
  value: string
  files: string[]
}

export interface FileSyncsType {
  [key: string]: FileSyncType
}

export interface ConfigurationType {
  repository: {
    apiBaseUrl: string
    url: string
    cloneDirectory: string
    local: boolean
  }
  fileSyncs: FileSyncsType,
  jobs: Job[]
}

export interface CommandOptions {
  dryRun: boolean
}
