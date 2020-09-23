// eslint-disable-next-line @typescript-eslint/no-var-requires
const _svg2img = require('svg2img');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Callback = (err: any, buffer: any) => any;

export enum Format {
  jpeg = 'jpeg',
  jpg = 'jpg',
  png = 'png',
}

export interface Svg2imgOptions {
  width?: number;
  height?: number;
  preserveAspectRatio?: boolean | string;
  format?: Format;
  quality?: number;
}

export function svg2img(svg: string, options: Svg2imgOptions = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    _svg2img(svg, options, (error: string, buffer: Buffer | undefined) => {
      if (error) {
        return reject(error);
      }
      return resolve(buffer);
    });
  });
}
