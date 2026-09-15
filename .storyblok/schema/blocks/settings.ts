import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

export const settingsBlock = defineBlock({
  name: 'settings',
  is_root: true,
  is_nestable: false,
  description: 'Settings',
  fields: [
    defineField('tagline', {
      display_name: '',
      required: true,
      type: 'text',
    }),
    defineField('navigation', {
      allow: [
        'element_link',
      ],
      type: 'bloks',
    }),
    defineField('footer_copy', {
      allow_target_blank: true,
      customize_toolbar: true,
      toolbar: [
        'bold',
        'italic',
        'link',
        'unset',
        'paragraph',
      ],
      type: 'richtext',
    }),
    defineField('footer_copy_v2', {
      customize_toolbar: true,
      toolbar: [
        'h2',
        'link',
        'paragraph',
        'unset',
      ],
      type: 'richtext',
    }),
  ],
});
