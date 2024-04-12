import {StoryblokStory} from 'storyblok-generate-ts'

export interface PageStoryblok {
  title?: string;
  seo: SeoStoryblok[];
  _uid: string;
  component: "page";
  uuid?: string;
  [k: string]: any;
}

export interface AssetStoryblok {
  _uid?: string;
  id: number;
  alt?: string;
  name: string;
  focus?: string;
  source?: string;
  title?: string;
  filename: string;
  copyright?: string;
  fieldtype?: string;
  meta_data?: null | {
    [k: string]: any;
  };
  is_external_url?: boolean;
  [k: string]: any;
}

export interface SeoStoryblok {
  seo_title: string;
  seo_description: string;
  seo_image: AssetStoryblok;
  _uid: string;
  component: "seo";
  [k: string]: any;
}
