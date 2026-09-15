import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { typesFolder } from '../../folders';

export const clientBlock = defineBlock({
  name: 'client',
  is_root: true,
  is_nestable: false,
  folder: typesFolder,
  fields: [
    defineField('name', {
      required: true,
      type: 'text',
    }),
  ],
});
