import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { blocksFolder } from '../../folders';

export const blockMediaBlock = defineBlock({
  name: 'block_media',
  display_name: 'Media',
  is_root: false,
  is_nestable: true,
  folder: blocksFolder,
  fields: [
    defineField('media', {
      allow: [
        'element_media_image',
        'element_media_autoplay',
      ],
      filetypes: [
        'images',
      ],
      minimum: 1,
      required: true,
      type: 'bloks',
    }),
    defineField('id', {
      type: 'text',
    }),
    defineField('theme', {
      datasource: 'themes',
      default_value: 'beige',
      exclude_empty_option: true,
      source: 'internal',
      type: 'option',
      use_uuid: true,
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
