import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

export const seoBlock = defineBlock({
  name: 'seo',
  is_root: false,
  is_nestable: true,
  fields: [
    defineField('seo_title', {
      display_name: 'Title',
      required: true,
      type: 'text',
    }),
    defineField('seo_description', {
      display_name: 'Description',
      required: true,
      type: 'text',
    }),
    defineField('seo_image', {
      display_name: 'Image',
      filetypes: [
        'images',
      ],
      required: true,
      type: 'asset',
    }),
  ],
});
