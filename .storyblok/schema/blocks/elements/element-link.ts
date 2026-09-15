import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { elementsFolder } from '../../folders';

export const elementLinkBlock = defineBlock({
  name: 'element_link',
  display_name: 'Link',
  is_root: false,
  is_nestable: true,
  folder: elementsFolder,
  fields: [
    defineField('text', {
      required: true,
      type: 'text',
    }),
    defineField('link', {
      allow_target_blank: true,
      email_link_type: true,
      required: true,
      type: 'multilink',
    }),
  ],
});
