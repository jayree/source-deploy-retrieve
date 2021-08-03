/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { WriteInfo } from '../types';
import { DecomposedMetadataTransformer } from './decomposedMetadataTransformer';
import { get, getString, JsonMap } from '@salesforce/ts-types';
import { normalizeToArray } from '../../utils';
import { SourceComponent } from '../../resolve';
import { MetadataType } from '../../registry/types';
/**
 * Metadata Transformer for metadata types with children types that are NOT decomposed into separate files.
 *
 * Example Types:
 * - CustomLabels
 */
export class NonDecomposedMetadataTransformer extends DecomposedMetadataTransformer {
  public async toSourceFormat(
    component: SourceComponent,
    mergeWith?: SourceComponent
  ): Promise<WriteInfo[]> {
    const parentXml = await component.parseXml();
    const children = mergeWith?.getChildren() ?? [];
    const claimedChildren = children.map((c) => c.name);
    for (const childTypeId of Object.keys(component.type.children.types)) {
      const childType = component.type.children.types[childTypeId];
      const uniqueIdElement = childType.uniqueIdElement;
      if (uniqueIdElement) {
        const xmlPathToChildren = `${component.type.name}.${childType.directoryName}`;
        const incomingChildrenXml = normalizeToArray(
          get(parentXml, xmlPathToChildren, [])
        ) as JsonMap[];
        for (const child of incomingChildrenXml) {
          const childName = getString(child, uniqueIdElement);
          if (claimedChildren.includes(childName)) {
            this.setStateForClaimed(mergeWith, childName, child, childType);
          } else {
            this.setStateForUnclaimed(component, childName, child, childType);
          }
        }
      }
    }

    return [];
  }

  private setStateForClaimed(
    parent: SourceComponent,
    childName: string,
    child: JsonMap,
    childType: MetadataType
  ): void {
    this.context.nonDecomposition.setState((state) => {
      const existingChildren = state.claimed[parent.xml]?.children ?? {};
      const updatedChildren = Object.assign({}, existingChildren, {
        [childName]: { source: child, childType },
      });
      state.claimed[parent.xml] = Object.assign(state.claimed[parent.xml] ?? {}, {
        parent,
        children: updatedChildren,
      });
    });
  }

  private setStateForUnclaimed(
    parent: SourceComponent,
    childName: string,
    child: JsonMap,
    childType: MetadataType
  ): void {
    this.context.nonDecomposition.setState((state) => {
      const existingChildren = state.unclaimed[parent.xml]?.children ?? {};
      const updatedChildren = Object.assign({}, existingChildren, {
        [childName]: { source: child, childType },
      });
      state.unclaimed[parent.xml] = Object.assign(state.unclaimed[parent.xml] ?? {}, {
        parent,
        children: updatedChildren,
      });
    });
  }
}
