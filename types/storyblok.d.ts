import {StoryblokStory} from 'storyblok-generate-ts'

export interface BentoStoryblok {
  items?: (
    | BentoGameStoryblok
    | BentoInstagramStoryblok
    | BentoMusicStoryblok
    | BentoNoticeStoryblok
    | BentoQrStoryblok
    | BentoShopifyStoryblok
    | BentoTeamStoryblok
    | BentoWeatherStoryblok
    | BentoWorkStoryblok
  )[];
  _uid: string;
  component: "bento";
  [k: string]: any;
}

export interface BentoGameStoryblok {
  _uid: string;
  component: "bento_game";
  [k: string]: any;
}

export interface BentoInstagramStoryblok {
  _uid: string;
  component: "bento_instagram";
  [k: string]: any;
}

export interface BentoMusicStoryblok {
  _uid: string;
  component: "bento_music";
  [k: string]: any;
}

export interface RichtextStoryblok {
  type: string;
  content?: RichtextStoryblok[];
  marks?: RichtextStoryblok[];
  attrs?: any;
  text?: string;
  [k: string]: any;
}

export interface BentoNoticeStoryblok {
  open_text: RichtextStoryblok;
  closed_text: RichtextStoryblok;
  times?: string;
  _uid: string;
  component: "bento_notice";
  [k: string]: any;
}

export interface BentoQrStoryblok {
  _uid: string;
  component: "bento_qr";
  [k: string]: any;
}

export interface BentoShopifyStoryblok {
  _uid: string;
  component: "bento_shopify";
  [k: string]: any;
}

export interface BentoTeamStoryblok {
  _uid: string;
  component: "bento_team";
  [k: string]: any;
}

export interface BentoWeatherStoryblok {
  _uid: string;
  component: "bento_weather";
  [k: string]: any;
}

export type MultiassetStoryblok = {
  alt?: string;
  copyright?: string;
  id: number;
  filename: string;
  name: string;
  title?: string;
  [k: string]: any;
}[];

export interface BentoWorkStoryblok {
  slides?: MultiassetStoryblok;
  _uid: string;
  component: "bento_work";
  [k: string]: any;
}

export interface BlockBentoBoxStoryblok {
  items?: (
    | BentoGameStoryblok
    | BentoInstagramStoryblok
    | BentoMusicStoryblok
    | BentoNoticeStoryblok
    | BentoQrStoryblok
    | BentoShopifyStoryblok
    | BentoTeamStoryblok
    | BentoWeatherStoryblok
    | BentoWorkStoryblok
  )[];
  colour: number | string;
  background: number | string;
  _uid: string;
  component: "block_bento_box";
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

export interface BlockMediaStoryblok {
  media: AssetStoryblok;
  ratio: number | string;
  _uid: string;
  component: "block_media";
  [k: string]: any;
}

export interface BlockStudiosStoryblok {
  text: RichtextStoryblok;
  studios?: StudioStoryblok[];
  colour: number | string;
  background: number | string;
  _uid: string;
  component: "block_studios";
  [k: string]: any;
}

export interface BlockTextStoryblok {
  text: RichtextStoryblok;
  colour: number | string;
  background: number | string;
  _uid: string;
  component: "block_text";
  [k: string]: any;
}

export interface PageStoryblok {
  blocks?: (BlockBentoBoxStoryblok | BlockMediaStoryblok | BlockStudiosStoryblok | BlockTextStoryblok)[];
  seo: SeoStoryblok[];
  _uid: string;
  component: "page";
  uuid?: string;
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

export interface StudioStoryblok {
  name: string;
  _uid: string;
  component: "studio";
  [k: string]: any;
}
