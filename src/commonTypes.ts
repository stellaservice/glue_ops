export interface Job {
  name: string
  fileSyncs: string[]
  branch: string
  approval: {
    enabled: boolean
  }
  pr: {
    body: string
  },
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
  synchronizationHash?: string
}

export interface MirrorSyncType {
  type: 'mirror'
  synchronizationHash?: string
  source: SourceType
  files: string[]
}

export interface SourceType {
  path: string
  directory: string
}

export type SyncType = FileSyncType | MirrorSyncType;

export interface FileSyncsType {
  [key: string]: SyncType
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
