import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockCompaniesBlock = defineBlock({
  name: 'block_companies',
  display_name: 'Companies',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  fields: [
    defineField('heading', {
      display_name: 'Heading',
      type: 'text',
    }),
    defineField('blocks', {
      allow: [
        'element_ticker',
      ],
      display_name: 'Tickers',
      minimum: 1,
      type: 'bloks',
    }),
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
    defineField('spacing_top', {
      default_value: true,
      display_name: 'Spacing Top',
      inline_label: true,
      type: 'boolean',
    }),
    defineField('spacing_bottom', {
      default_value: true,
      display_name: 'Spacing Bottom',
      inline_label: true,
      type: 'boolean',
    }),
  ],
});
