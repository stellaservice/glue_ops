import RollbackPublish from './rollbackPublish';
import { findGlueOpsBotPrs, revertPr, addLabelsToPr } from './pr';
import loadTemplatedConfiguration from './config';
import { RestGhClient, GraphqlGhClient } from './utils';

jest.mock('./utils', () => (
  {
    __esModule: true,
    GraphqlGhClient: jest.fn(),
    RestGhClient: jest.fn(),
  }
));

const nodeId = '3x34dssafd';
jest.mock('./pr', () => {
  const findPrMock = jest.fn(() => ([{ node_id: nodeId }]));
  const revertPrMock = jest.fn(() => ({
    revertPullRequest: {
      revertPullRequest: {
        url: 'repo.com/pulls/9',
        number: 9,
      },
    },
  }));

  return {
    __esModule: true,
    findGlueOpsBotPrs: findPrMock,
    revertPr: revertPrMock,
    addLabelsToPr: jest.fn(),
  };
});

describe('RollbackPublish', () => {
  it('calls ', async () => {
    const opts = { dryRun: false };
    const config = loadTemplatedConfiguration('test/fixtures/glue_ops_jobs_merge.yaml');

    await RollbackPublish(config, opts);

    expect(findGlueOpsBotPrs).toBeCalled();
    expect(revertPr).toBeCalledWith(GraphqlGhClient(), nodeId);
    expect(addLabelsToPr).toBeCalledWith(
      expect.objectContaining({
        ghClient: RestGhClient(),
        prNumber: 9,
        additionalLabels: ['Rollback'],
      }),
    );
  });
});
