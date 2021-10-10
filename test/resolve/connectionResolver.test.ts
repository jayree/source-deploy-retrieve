/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect } from 'chai';
import { MockTestOrgData, testSetup } from '@salesforce/core/lib/testSetup';
import { createSandbox, SinonSandbox } from 'sinon';
import { Connection } from '@salesforce/core';
import { mockConnection } from '../mock/client';
import { ConnectionResolver } from '../../src/resolve';
import { MetadataComponent, registry } from '../../src/';

const $$ = testSetup();

describe('ConnectionResolver', () => {
  let sandboxStub: SinonSandbox;
  let connection: Connection;
  const testData = new MockTestOrgData();

  beforeEach(async () => {
    sandboxStub = createSandbox();
    $$.setConfigStubContents('AuthInfoConfig', {
      contents: await testData.getConfig(),
    });
    connection = await mockConnection($$);
  });

  afterEach(() => {
    sandboxStub.restore();
  });

  describe('resolve', () => {
    it('should resolve parent and child components', async () => {
      const metadataQueryStub = sandboxStub.stub(connection.metadata, 'list');

      metadataQueryStub.withArgs({ type: 'CustomObject' }).resolves([
        {
          createdById: '0051x000007uOWaAAM',
          createdByName: 'Pooled Org Admin',
          createdDate: '2021-09-25T12:43:33.000Z',
          fileName: 'objects/Account.object',
          fullName: 'Account',
          id: '00e1x000000Kg0PAAS',
          lastModifiedById: '0051x0000081x7kAAA',
          lastModifiedByName: 'User User',
          lastModifiedDate: '2021-09-25T12:44:08.000Z',
          type: 'CustomObject',
        },
      ]);
      metadataQueryStub.withArgs({ type: 'CustomField' }).resolves([
        {
          createdById: '0051x000007uOWaAAM',
          createdByName: 'Pooled Org Admin',
          createdDate: '2021-09-25T12:43:33.000Z',
          fileName: 'objects/Account.object',
          fullName: 'Account.testc',
          id: '00e1x000000Kg0PAAS',
          lastModifiedById: '0051x0000081x7kAAA',
          lastModifiedByName: 'User User',
          lastModifiedDate: '2021-09-25T12:44:08.000Z',
          type: 'CustomField',
        },
        {
          createdById: '0051x000007uOWaAAM',
          createdByName: 'Pooled Org Admin',
          createdDate: '2021-09-25T12:43:33.000Z',
          fileName: 'objects/Account.object',
          fullName: 'Account.testa',
          id: '00e1x000000Kg0PAAS',
          lastModifiedById: '0051x0000081x7kAAA',
          lastModifiedByName: 'User User',
          lastModifiedDate: '2021-09-25T12:44:08.000Z',
          type: 'CustomField',
        },
        {
          createdById: '0051x000007uOWaAAM',
          createdByName: 'Pooled Org Admin',
          createdDate: '2021-09-25T12:43:33.000Z',
          fileName: 'objects/Account.object',
          fullName: 'Account.testb',
          id: '00e1x000000Kg0PAAS',
          lastModifiedById: '0051x0000081x7kAAA',
          lastModifiedByName: 'User User',
          lastModifiedDate: '2021-09-25T12:44:08.000Z',
          type: 'CustomField',
        },
      ]);

      const resolver = new ConnectionResolver(connection);
      const result = await resolver.resolve();
      const expected: MetadataComponent[] = [
        {
          fullName: 'Account.testa',
          type: registry.types.customobject.children.types.customfield,
        },
        {
          fullName: 'Account.testb',
          type: registry.types.customobject.children.types.customfield,
        },
        {
          fullName: 'Account.testc',
          type: registry.types.customobject.children.types.customfield,
        },
        {
          fullName: 'Account',
          type: registry.types.customobject,
        },
      ];
      expect(result.components).to.deep.equal(expected);
    });
    it('should resolve components with different types', async () => {
      const metadataQueryStub = sandboxStub.stub(connection.metadata, 'list');

      metadataQueryStub.withArgs({ type: 'CustomLabels' }).resolves([
        {
          createdById: '0051x000007uOWaAAM',
          createdByName: 'Pooled Org Admin',
          createdDate: '2021-09-25T12:43:33.000Z',
          fileName: 'labels/CustomLabels.labels',
          fullName: 'Account',
          id: '00e1x000000Kg0PAAS',
          lastModifiedById: '0051x0000081x7kAAA',
          lastModifiedByName: 'User User',
          lastModifiedDate: '2021-09-25T12:44:08.000Z',
          type: 'CustomLabels',
        },
      ]);
      metadataQueryStub.withArgs({ type: 'Workflow' }).resolves([
        {
          createdById: '0051x000007uOWaAAM',
          createdByName: 'Pooled Org Admin',
          createdDate: '2021-09-25T12:43:33.000Z',
          fileName: 'workflows/Account.workflow',
          fullName: 'Account',
          id: '00e1x000000Kg0PAAS',
          lastModifiedById: '0051x0000081x7kAAA',
          lastModifiedByName: 'User User',
          lastModifiedDate: '2021-09-25T12:44:08.000Z',
          type: 'Workflow',
        },
      ]);

      const resolver = new ConnectionResolver(connection);
      const result = await resolver.resolve();
      const expected: MetadataComponent[] = [
        {
          fullName: 'Account',
          type: registry.types.customlabels,
        },
        {
          fullName: 'Account',
          type: registry.types.workflow,
        },
      ];
      expect(result.components).to.deep.equal(expected);
    });
    it('should resolve components with folderContentType', async () => {
      const metadataQueryStub = sandboxStub.stub(connection.metadata, 'list');

      metadataQueryStub.withArgs({ type: 'EmailFolder' }).resolves([
        {
          createdById: '0051x0000081x7kAAA',
          createdByName: 'User User',
          createdDate: '1970-01-01T00:00:00.000Z',
          fileName: 'unfiled$public',
          fullName: 'unfiled$public',
          id: '',
          lastModifiedById: '0051x0000081x7kAAA',
          lastModifiedByName: 'User User',
          lastModifiedDate: '1970-01-01T00:00:00.000Z',
          manageableState: 'unmanaged',
          namespacePrefix: '',
          type: 'EmailFolder',
        },
      ]);
      metadataQueryStub.withArgs({ type: 'EmailTemplate' }).resolves([
        {
          createdById: '0051x0000081x7kAAA',
          createdByName: 'User User',
          createdDate: '2021-09-25T12:44:11.000Z',
          fileName: 'email/unfiled$public/test.email',
          fullName: 'unfiled$public/test',
          id: '00X1x000003Hs4ZEAS',
          lastModifiedById: '0051x0000081x7kAAA',
          lastModifiedByName: 'User User',
          lastModifiedDate: '2021-09-25T12:44:11.000Z',
          manageableState: 'unmanaged',
          type: 'EmailTemplate',
        },
      ]);

      const resolver = new ConnectionResolver(connection);
      const result = await resolver.resolve();
      const expected: MetadataComponent[] = [
        {
          fullName: 'unfiled$public',
          type: registry.types.emailfolder,
        },
        {
          fullName: 'unfiled$public/test',
          type: registry.types.emailtemplate,
        },
      ];
      expect(result.components).to.deep.equal(expected);
    });
    it('should catch error if MetadataType is not supported', async () => {
      const metadataQueryStub = sandboxStub.stub(connection.metadata, 'list');

      metadataQueryStub
        .withArgs({ type: 'EventType' })
        .throws(new Error('INVALID_TYPE: Cannot use: EventType in this version'));

      const resolver = new ConnectionResolver(connection);
      const result = await resolver.resolve();
      expect(result.components).to.deep.equal([]);
    });
    it('should resolve standardValueSet components from tooling api', async () => {
      sandboxStub.stub(connection.metadata, 'list');

      const mockToolingQuery = sandboxStub.stub(connection.tooling, 'query');
      mockToolingQuery
        .withArgs(
          "SELECT MasterLabel, Metadata FROM StandardValueSet WHERE MasterLabel = 'AccountOwnership'"
        )
        .resolves({
          size: 1,
          totalSize: 1,
          done: true,
          entityTypeName: 'StandardValueSet',
          records: [
            {
              MasterLabel: 'AccountOwnership',
              Metadata: {
                standardValue: [
                  {
                    property: null,
                  },
                ],
              },
            },
          ],
        } as {
          entityTypeName: string;
          size: number;
          totalSize: number;
          done: boolean;
          records: Array<{
            MasterLabel: string;
            Metadata: { standardValue: Record<string, unknown>[] };
          }>;
        });

      mockToolingQuery
        .withArgs(
          "SELECT MasterLabel, Metadata FROM StandardValueSet WHERE MasterLabel = 'AccountContactMultiRoles'"
        )
        .resolves({
          size: 1,
          totalSize: 1,
          done: true,
          entityTypeName: 'StandardValueSet',
          records: [
            {
              MasterLabel: 'AccountContactMultiRoles',
            },
          ],
        } as {
          entityTypeName: string;
          size: number;
          totalSize: number;
          done: boolean;
          records: Array<{
            MasterLabel: string;
            Metadata: { standardValue: Record<string, unknown>[] };
          }>;
        });

      const resolver = new ConnectionResolver(connection);
      const result = await resolver.resolve();
      const expected: MetadataComponent[] = [
        {
          fullName: 'AccountOwnership',
          type: registry.types.standardvalueset,
        },
      ];
      expect(result.components).to.deep.equal(expected);
    });
    it('should resolve no managed components', async () => {
      const metadataQueryStub = sandboxStub.stub(connection.metadata, 'list');

      metadataQueryStub.withArgs({ type: 'DashboardFolder' }).resolves([
        {
          createdById: '0051x000007uOWaAAM',
          createdByName: 'Pooled Org Admin',
          createdDate: '2021-09-25T11:26:17.000Z',
          fileName: 'dashboards/SK__Knowledge_Dashboard',
          fullName: 'SK__Knowledge_Dashboard',
          id: '00l1x000000ZP6EAAW',
          lastModifiedById: '0051x000007uOWaAAM',
          lastModifiedByName: 'Pooled Org Admin',
          lastModifiedDate: '2021-09-25T11:26:17.000Z',
          manageableState: 'installed',
          namespacePrefix: 'SK',
          type: 'DashboardFolder',
        },
      ]);
      metadataQueryStub.withArgs({ type: 'InstalledPackage' }).resolves([
        {
          createdById: '0051x000007uOWaAAM',
          createdByName: 'Pooled Org Admin',
          createdDate: '2021-09-25T11:26:17.000Z',
          fileName: 'installedPackages/SK.installedPackage',
          fullName: 'SK',
          id: '0A31x0000003p64CAA',
          lastModifiedById: '0051x000007uOWaAAM',
          lastModifiedByName: 'Pooled Org Admin',
          lastModifiedDate: '2021-09-25T11:26:17.000Z',
          namespacePrefix: 'SK',
          type: 'InstalledPackage',
        },
      ]);

      const resolver = new ConnectionResolver(connection);
      const result = await resolver.resolve();
      expect(result.components).to.deep.equal([]);
    });
    it('should resolve managed components if excludeManaged is false', async () => {
      const metadataQueryStub = sandboxStub.stub(connection.metadata, 'list');

      metadataQueryStub.withArgs({ type: 'DashboardFolder' }).resolves([
        {
          createdById: '0051x000007uOWaAAM',
          createdByName: 'Pooled Org Admin',
          createdDate: '2021-09-25T11:26:17.000Z',
          fileName: 'dashboards/SK__Knowledge_Dashboard',
          fullName: 'SK__Knowledge_Dashboard',
          id: '00l1x000000ZP6EAAW',
          lastModifiedById: '0051x000007uOWaAAM',
          lastModifiedByName: 'Pooled Org Admin',
          lastModifiedDate: '2021-09-25T11:26:17.000Z',
          manageableState: 'installed',
          namespacePrefix: 'SK',
          type: 'DashboardFolder',
        },
      ]);
      metadataQueryStub.withArgs({ type: 'InstalledPackage' }).resolves([
        {
          createdById: '0051x000007uOWaAAM',
          createdByName: 'Pooled Org Admin',
          createdDate: '2021-09-25T11:26:17.000Z',
          fileName: 'installedPackages/SK.installedPackage',
          fullName: 'SK',
          id: '0A31x0000003p64CAA',
          lastModifiedById: '0051x000007uOWaAAM',
          lastModifiedByName: 'Pooled Org Admin',
          lastModifiedDate: '2021-09-25T11:26:17.000Z',
          namespacePrefix: 'SK',
          type: 'InstalledPackage',
        },
      ]);

      const resolver = new ConnectionResolver(connection);
      const result = await resolver.resolve(false);
      const expected: MetadataComponent[] = [
        {
          fullName: 'SK__Knowledge_Dashboard',
          type: registry.types.dashboardfolder,
        },
        {
          fullName: 'SK',
          type: registry.types.installedpackage,
        },
      ];
      expect(result.components).to.deep.equal(expected);
    });
  });
});
