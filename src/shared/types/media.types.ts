export interface MediaImage {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

export type MediaImageSource = MediaImage | string;
