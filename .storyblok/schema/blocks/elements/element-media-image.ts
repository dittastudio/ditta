import {
  defineBlock,
  defineField,
} from '@storyblok/schema';

import { elementsFolder } from '../../folders';

export const elementMediaImageBlock = defineBlock({
  name: 'element_media_image',
  display_name: 'Image',
  is_root: false,
  is_nestable: true,
  folder: elementsFolder,
  description: '',
  fields: [
    defineField('layout', {
      default_value: 'wide',
      exclude_empty_option: true,
      options: [
        {
          _uid: 'ea6e8178-632c-4f50-87ee-7eed08d0c3a7',
          name: 'Half',
          value: 'half',
        },
        {
          _uid: '9255d7a0-3d3a-4070-995a-d3f86a4e3493',
          name: 'Wide',
          value: 'wide',
        },
        {
          _uid: '4bdfd8cf-c909-4d21-8e16-4eef7924d96a',
          name: 'Full',
          value: 'full',
        },
      ],
      required: true,
      type: 'option',
      use_uuid: true,
    }),
    defineField('image', {
      asset_folder_id: 173375575949929,
      filetypes: [
        'images',
      ],
      required: true,
      type: 'asset',
    }),
  ],
});
