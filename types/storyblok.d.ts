import {StoryblokStory} from 'storyblok-generate-ts'

export interface PageStoryblok {
  _uid: string;
  component: "page";
  uuid?: string;
  [k: string]: any;
}
