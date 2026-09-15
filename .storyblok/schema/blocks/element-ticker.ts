import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

export const elementTickerBlock = defineBlock({
  name: 'element_ticker',
  display_name: 'Ticker',
  is_root: false,
  is_nestable: true,
  fields: [
    defineField('items', {
      display_name: 'Items',
      filetypes: [
        'images',
      ],
      type: 'multiasset',
    }),
  ],
});
