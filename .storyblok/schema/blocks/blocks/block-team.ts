import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockTeamBlock = defineBlock({
  name: 'block_team',
  display_name: 'Team',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  fields: [
    defineField('heading', {
      required: true,
      type: 'textarea',
    }),
    defineField('copy', {
      customize_toolbar: true,
      required: true,
      toolbar: [
        'bold',
        'italic',
        'unset',
        'paragraph',
      ],
      type: 'richtext',
    }),
    defineField('cta', {
      allow: [
        'element_cta',
      ],
      maximum: 1,
      type: 'bloks',
    }),
    defineField('humans', {
      entry_appearance: 'card',
      filter_content_type: [
        'person',
      ],
      source: 'internal_stories',
      type: 'options',
      use_uuid: true,
    }),
    defineField('theme', {
      datasource: 'themes',
      default_value: 'light',
      exclude_empty_option: true,
      source: 'internal',
      type: 'option',
      use_uuid: true,
    }),
    defineField('id', {
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
