/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { RegistryAccess, registry, MetadataType } from '../registry';
import { Connection, Logger } from '@salesforce/core';
import { FileProperties, ListMetadataQuery } from 'jsforce';
import { deepFreeze, normalizeToArray } from '../utils';
import * as standardValueSetData from '../registry/standardvalueset.json';
import { MetadataComponent } from '.';

const stdValueSets = deepFreeze(standardValueSetData);

export interface ResolveConnectionResult {
  components: MetadataComponent[];
}

/**
 * Resolve MetadataComponents from an org connection
 */
export class ConnectionResolver {
  protected logger: Logger;
  private connection: Connection;
  private registry: RegistryAccess;

  constructor(connection: Connection, registry = new RegistryAccess()) {
    this.connection = connection;
    this.registry = registry;
    this.logger = Logger.childFromRoot(this.constructor.name);
  }

  public async resolve(excludeManaged = true): Promise<ResolveConnectionResult> {
    const Aggregator: Partial<FileProperties>[] = [];
    const childrenPromises: Array<Promise<FileProperties[]>> = [];
    const componentTypes: Set<MetadataType> = new Set();

    const componentPromises: Array<Promise<FileProperties[]>> = [];
    for (const type of Object.values(registry.types)) {
      componentPromises.push(this.listMembers({ type: type.name }));
    }
    for await (const componentResult of componentPromises) {
      Aggregator.push(...componentResult);
      for (const component of componentResult) {
        const componentType = this.registry.getTypeByName(component.type);
        componentTypes.add(componentType);
        const folderContentType = componentType.folderContentType;
        if (folderContentType) {
          childrenPromises.push(
            this.listMembers({
              type: this.registry.getTypeByName(componentType.folderContentType).name,
              folder: component.fullName,
            })
          );
        }
      }
    }

    for (const componentType of componentTypes) {
      const childTypes = componentType.children?.types;
      if (childTypes) {
        Object.values(childTypes).map((childType) => {
          childrenPromises.push(this.listMembers({ type: childType.name }));
        });
      }
    }

    for await (const childrenResult of childrenPromises) {
      Aggregator.push(...childrenResult);
    }

    const standardValueSetPromises = stdValueSets.fullNames.map(async (member) => {
      try {
        const [standardValueSet] = ((await this.connection.tooling.query(
          `SELECT MasterLabel, Metadata FROM StandardValueSet WHERE MasterLabel = '${member}'`
        )) as {
          records: Array<{
            MasterLabel: string;
            Metadata: { standardValue: Record<string, unknown>[] };
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

    for await (const fullName of standardValueSetPromises) {
      if (fullName) {
        Aggregator.push({
          fullName,
          type: registry.types.standardvalueset.name,
        });
      }
    }

    const components = Aggregator.filter(
      (component) =>
        !(excludeManaged && component.namespacePrefix && component.manageableState !== 'unmanaged')
    )
      .map((component) => {
        return { fullName: component.fullName, type: this.registry.getTypeByName(component.type) };
      })
      .sort((a, b) => {
        if (a.type.name === b.type.name) {
          return a.fullName.toLowerCase() > b.fullName.toLowerCase() ? 1 : -1;
        }
        return a.type.name.toLowerCase() > b.type.name.toLowerCase() ? 1 : -1;
      });

    return {
      components,
    };
  }

  private async listMembers(
    queries: ListMetadataQuery | ListMetadataQuery[],
    apiVersion?: string
  ): Promise<FileProperties[]> {
    let members: FileProperties[];

    try {
      members = normalizeToArray(await this.connection.metadata.list(queries, apiVersion));
    } catch (error) {
      this.logger.error(error.message);
      members = [];
    }
    return members;
  }
}
