/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { join } from 'path';
import { mockRegistryData } from '../mockRegistry';
import { registry, SourceComponent, VirtualDirectory, VirtualTreeContainer } from '../../../../src';
import { META_XML_SUFFIX, XML_NS_KEY, XML_NS_URL } from '../../../../src/common';
import { JsToXml } from '../../../../src/convert/streams';

// Constants for a matching content file type
const type = mockRegistryData.types.nondecomposed;

export const WORKING_DIR = join(process.cwd(), 'my-project');

export const DEFAULT_DIR = join(WORKING_DIR, 'force-app');
export const NON_DEFAULT_DIR = join(WORKING_DIR, 'my-app');

export const XML_NAME = `${type.name}.${type.suffix}${META_XML_SUFFIX}`;

export const COMPONENT_1_TYPE_DIR = join(DEFAULT_DIR, 'path', 'to', type.directoryName);
export const COMPONENT_2_TYPE_DIR = join(NON_DEFAULT_DIR, type.directoryName);
export const COMPONENT_1_XML_PATH = join(COMPONENT_1_TYPE_DIR, XML_NAME);
export const COMPONENT_2_XML_PATH = join(COMPONENT_2_TYPE_DIR, XML_NAME);

export const CHILD_1_NAME = 'Child_1';
export const CHILD_2_NAME = 'Child_2';
export const CHILD_3_NAME = 'Child_3';
export const UNCLAIMED_CHILD_NAME = 'Unclaimed_Child';

export const CHILD_1_XML = { id: CHILD_1_NAME, description: 'the first child' };
export const CHILD_2_XML = { id: CHILD_2_NAME, description: 'the second child' };
export const CHILD_3_XML = { id: CHILD_3_NAME, description: 'the third child' };
export const UNCLAIMED_CHILD_XML = { id: UNCLAIMED_CHILD_NAME, description: 'the unclaimed child' };

export const COMPONENT_1_XML = {
  [type.name]: {
    [XML_NS_KEY]: XML_NS_URL,
    [type.directoryName]: [CHILD_1_XML, CHILD_2_XML],
  },
};

export const COMPONENT_2_XML = {
  [type.name]: {
    [XML_NS_KEY]: XML_NS_URL,
    [type.directoryName]: CHILD_3_XML,
  },
};

export const CLAIMED_XML_CONTENT = {
  [type.name]: {
    [XML_NS_KEY]: XML_NS_URL,
    [type.directoryName]: [CHILD_1_XML, CHILD_2_XML, CHILD_3_XML],
  },
};

export const UNCLAIMED_XML_CONTENT = {
  [type.name]: {
    [XML_NS_KEY]: XML_NS_URL,
    [type.directoryName]: UNCLAIMED_CHILD_XML,
  },
};

export const FULL_XML_CONTENT = {
  [type.name]: {
    [XML_NS_KEY]: XML_NS_URL,
    [type.directoryName]: [CHILD_1_XML, CHILD_2_XML, CHILD_3_XML, UNCLAIMED_CHILD_XML],
  },
};

export const MANAGED_TOPICS_TYPE = registry.types.managedtopics;
// NOTE: directory name uses the string literal rather than getting from MANAGED_TOPICS_TYPE
// so it explictly shows that this matches the xml field
export const MANAGED_TOPICS_TYPE_DIRECTORY_NAME = 'managedTopics';
export const MANAGED_TOPICS_XML_NAME = 'SiteName.managedTopic-meta.xml';
export const MANAGED_TOPICS_COMPONENT_DIR = join(DEFAULT_DIR, MANAGED_TOPICS_TYPE_DIRECTORY_NAME);
export const MANAGED_TOPICS_COMPONENT_XML_PATH = join(
  MANAGED_TOPICS_COMPONENT_DIR,
  MANAGED_TOPICS_XML_NAME
);
export const MANAGED_TOPICS_COMPONENT_XML = {
  ManagedTopics: {
    '@_xmlns': 'http://soap.sforce.com/2006/04/metadata',
    ManagedTopic: {
      name: 'Running',
      managedTopicType: 'Navigational',
      topicDescription: 'Training advice',
      parentName: '',
      position: 0,
    },
  },
};

export const VIRTUAL_DIR: VirtualDirectory[] = [
  { dirPath: WORKING_DIR, children: [DEFAULT_DIR, NON_DEFAULT_DIR] },
  { dirPath: DEFAULT_DIR, children: [] },
  { dirPath: NON_DEFAULT_DIR, children: [] },
  {
    dirPath: COMPONENT_1_TYPE_DIR,
    children: [
      { name: XML_NAME, data: Buffer.from(new JsToXml(COMPONENT_1_XML).read().toString()) },
    ],
  },
  {
    dirPath: COMPONENT_2_TYPE_DIR,
    children: [
      { name: XML_NAME, data: Buffer.from(new JsToXml(COMPONENT_2_XML).read().toString()) },
    ],
  },
  {
    dirPath: MANAGED_TOPICS_COMPONENT_DIR,
    children: [
      {
        name: MANAGED_TOPICS_XML_NAME,
        data: Buffer.from(new JsToXml(MANAGED_TOPICS_COMPONENT_XML).read().toString()),
      },
    ],
  },
];

export const TREE = new VirtualTreeContainer(VIRTUAL_DIR);

export const COMPONENT_1 = new SourceComponent(
  { name: type.name, type, xml: COMPONENT_1_XML_PATH },
  TREE
);

export const COMPONENT_2 = new SourceComponent(
  { name: type.name, type, xml: COMPONENT_2_XML_PATH },
  TREE
);

export const MANAGED_TOPICS_COMPONENT = new SourceComponent(
  {
    name: MANAGED_TOPICS_TYPE.name,
    type: MANAGED_TOPICS_TYPE,
    xml: MANAGED_TOPICS_COMPONENT_XML_PATH,
  },
  TREE
);
