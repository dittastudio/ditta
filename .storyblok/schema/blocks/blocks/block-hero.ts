import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockHeroBlock = defineBlock({
  name: 'block_hero',
  display_name: 'Hero',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  fields: [
    defineField('theme', {
      datasource: 'themes',
      default_value: 'light',
      display_name: 'Theme',
      exclude_empty_option: true,
      source: 'internal',
      type: 'option',
      use_uuid: true,
    }),
    defineField('id', {
      display_name: 'ID',
      type: 'text',
    }),
  ],
});
