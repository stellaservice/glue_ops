const GhUrlParser = require('parse-github-url');
const loadTemplatedConfiguration = require('./config');
const Merge = require('./merge');
const { GhClient } = require('./utils');
const {
  approvePr, pollStatusCheck, mergePr, findGlueOpsBotPrs,
} = require('./pr');

jest.mock('./pr', () => {
  const approveMock = jest.fn();
  const pollStatusMock = jest.fn(() => (true));
  const mergeMock = jest.fn();
  const findPrMock = jest.fn(() => ([{ number: 1 }]));

  return {
    __esModule: true,
    pollStatusCheck: pollStatusMock,
    approvePr: approveMock,
    mergePr: mergeMock,
    findGlueOpsBotPrs: findPrMock,
  };
});

jest.mock('./utils', () => (
  {
    __esModule: true,
    GhClient: jest.fn(() => ('client')),
  }
));

describe('Merge', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const config = loadTemplatedConfiguration('test/fixtures/glue_ops_jobs_merge.yaml');

  it('calls for pr approval, poll status, and merge', async () => {
    const repositoryUrl = new GhUrlParser(config.repository.url);
    const ghClient = GhClient();

    await Merge(config);

    expect(findGlueOpsBotPrs).toBeCalledWith(
      ghClient,
      repositoryUrl.owner,
      repositoryUrl.name,
      config.jobs[0].branch,
      config.jobs[0].name,
    );

    const pr = findGlueOpsBotPrs()[0];
    expect(pollStatusCheck).toBeCalledWith(
      ghClient,
      pr,
      repositoryUrl,
      config.jobs[0].merge.pollPrTimeout,
    );
    expect(approvePr).toBeCalledWith(
      ghClient,
      pr,
      repositoryUrl,
    );
    expect(mergePr).toBeCalledWith(
      ghClient,
      pr,
      repositoryUrl,
      config.jobs[0].merge.method,
    );
  });

  it('doesn\'t call pr functions when dry run enabled', async () => {
    await Merge(config, { dryRun: true });

    expect(pollStatusCheck).not.toBeCalled();
    expect(approvePr).not.toBeCalled();
    expect(mergePr).not.toBeCalled();
  });

  it('doesn\'t call approval when disabled', async () => {
    const duplicatedConfig = { ...config };
    duplicatedConfig.jobs[0].approval.enabled = false;

    await Merge(duplicatedConfig);
    config.jobs[0].approval.enabled = true;

    expect(pollStatusCheck).toBeCalled();
    expect(mergePr).toBeCalled();
    expect(approvePr).not.toBeCalled();
  });

  it('Uses modified GH client for approval token', async () => {
    await Merge(config);

    expect(GhClient).toHaveBeenNthCalledWith(2, undefined, config.jobs[0].approval.token);
  });
});