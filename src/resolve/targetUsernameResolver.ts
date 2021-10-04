/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { RegistryAccess, registry } from '../registry';
import { AuthInfo, Connection, Logger } from '@salesforce/core';
import { FileProperties, ListMetadataQuery } from 'jsforce';
import { deepFreeze, normalizeToArray } from '../utils';
import * as standardValueSetData from '../registry/standardvalueset.json';
import { ComponentLike } from '.';

const stdValueSets = deepFreeze(standardValueSetData);

export interface ResolveTargetUsernameResult {
  components: ComponentLike[];
}

export interface FilePropertiesLike {
  fullName: string;
  type: string;
  namespacePrefix?: string;
  manageableState?: string;
}

/**
 * Resolve MetadataComponents from a manifest file (package.xml)
 */
export class TargetUsernameResolver {
  protected logger: Logger;
  private usernameOrConnection: string | Connection;
  private apiVersion: string;
  private registry: RegistryAccess;

  constructor(
    usernameOrConnection: string | Connection,
    apiVersion: string,
    registry = new RegistryAccess()
  ) {
    this.usernameOrConnection = usernameOrConnection;
    this.apiVersion = apiVersion;
    this.registry = registry;
    this.logger = Logger.childFromRoot(this.constructor.name);
  }

  public async resolve(): Promise<ResolveTargetUsernameResult> {
    await this.getConnection();
    const Aggregator: ComponentLike[] = [];
    const folderPromises: Array<Promise<FileProperties[]>> = [];
    const childrenPromises: Array<Promise<FileProperties[]>> = [];
    const componentPromises = Object.values(registry.types).map((type) => {
      return this.listMembers({ type: type.name });
    });
    for await (const componentResult of componentPromises) {
      for (const component of componentResult) {
        Aggregator.push(component);
        const componentType = this.registry.getTypeByName(component.type.toLowerCase());
        const childTypes = componentType.children?.types;
        if (childTypes) {
          Object.values(childTypes).map((childType) => {
            childrenPromises.push(this.listMembers({ type: childType.name }));
          });
        }
        const folderContentType = componentType.folderContentType;
        if (folderContentType) {
          folderPromises.push(
            this.listMembers({
              type: this.registry.getTypeByName(componentType.folderContentType).name,
              folder: component.fullName,
            })
          );
        }
      }
    }
    this.logger.debug('componentPromises finished');
    for await (const folderResult of folderPromises) {
      for (const component of folderResult) {
        Aggregator.push(component);
      }
    }
    this.logger.debug('folderPromises finished');

    for await (const childrenResult of childrenPromises) {
      for (const component of childrenResult) {
        Aggregator.push(component);
      }
    }
    this.logger.debug('childrenPromises finished');

    const standardValueSetPromises = stdValueSets.fullNames.map(async (member) => {
      try {
        if (!(this.usernameOrConnection instanceof Connection)) {
          throw new Error('no connection');
        }
        const [standardValueSet] = ((await this.usernameOrConnection.tooling.query(
          `SELECT MasterLabel, Metadata FROM StandardValueSet WHERE MasterLabel = '${member}'`
        )) as {
          records: Array<{
            MasterLabel: string;
            Metadata: { standardValue: [] };
          }>;
        }).records;
        if (standardValueSet.Metadata?.standardValue.length) {
          return standardValueSet.MasterLabel;
        }
        // eslint-disable-next-line no-empty
      } catch (error) {
        this.logger.error(error.message);
      }
    });

    for await (const standardValueSetName of standardValueSetPromises) {
      if (standardValueSetName) {
        Aggregator.push({ fullName: standardValueSetName, type: 'StandardValueSet' });
      }
    }
    this.logger.debug('standardValueSetPromises finished');

    const components = Aggregator.sort((a, b) => {
      if (a.fullName < b.fullName) {
        return -1;
      }
      if (a.fullName > b.fullName) {
        return 1;
      }
      return 0;
    });

    return {
      components,
    };
  }

  protected async getConnection(): Promise<Connection> {
    if (typeof this.usernameOrConnection === 'string') {
      this.usernameOrConnection = await Connection.create({
        authInfo: await AuthInfo.create({ username: this.usernameOrConnection }),
      });
      if (this.apiVersion && this.apiVersion !== this.usernameOrConnection.version) {
        this.usernameOrConnection.setApiVersion(this.apiVersion);
        this.logger.debug(`Overriding apiVersion to: ${this.apiVersion}`);
      }
    }
    return this.usernameOrConnection;
  }

  private async listMembers(
    queries: ListMetadataQuery | ListMetadataQuery[],
    apiVersion?: string
  ): Promise<FileProperties[]> {
    let members: FileProperties[];

    if (!(this.usernameOrConnection instanceof Connection)) {
      throw new Error('no connection');
    }

    try {
      if (!apiVersion) {
        apiVersion = this.usernameOrConnection.getApiVersion();
      }
      members = normalizeToArray(
        await this.usernameOrConnection.metadata.list(queries, apiVersion)
      );
    } catch (error) {
      members = [];
    }
    return members;
  }
}
