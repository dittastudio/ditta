import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { typesFolder } from '../../folders';

export const personBlock = defineBlock({
  name: 'person',
  display_name: 'Person',
  is_root: true,
  is_nestable: false,
  folder: typesFolder,
  preview_field: 'name',
  fields: [
    defineField('image', {
      filetypes: [
        'images',
      ],
      required: true,
      type: 'asset',
    }),
    defineField('name', {
      required: true,
      type: 'text',
    }),
    defineField('position', {
      type: 'text',
    }),
  ],
});
