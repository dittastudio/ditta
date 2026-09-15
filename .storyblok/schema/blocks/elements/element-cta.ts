import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { elementsFolder } from '../../folders';

export const elementCtaBlock = defineBlock({
  name: 'element_cta',
  display_name: 'CTA',
  is_root: false,
  is_nestable: true,
  folder: elementsFolder,
  fields: [
    defineField('text', {
      required: true,
      type: 'text',
    }),
    defineField('link', {
      email_link_type: true,
      required: true,
      type: 'multilink',
    }),
    defineField('theme', {
      datasource: 'themes',
      default_value: 'light',
      exclude_empty_option: true,
      source: 'internal',
      type: 'option',
      use_uuid: true,
    }),
  ],
});
