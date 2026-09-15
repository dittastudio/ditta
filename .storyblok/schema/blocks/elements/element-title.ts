import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { elementsFolder } from '../../folders';

export const elementTitleBlock = defineBlock({
  name: 'element_title',
  display_name: 'Title',
  is_root: false,
  is_nestable: true,
  folder: elementsFolder,
  preview_field: 'title',
  fields: [
    defineField('title', {
      display_name: 'Title',
      required: true,
      type: 'text',
    }),
  ],
});
