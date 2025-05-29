declare namespace App {
  type TAspectRatios =
    'auto'
    | '16:9'
    | '9:16'
    | '8:9'
    | '3:2'
    | '2:3'
    | '4:3'
    | '3:4'
    | '1:1.414'
    | '1:1'

  export interface ImageDimensions {
    width: number
    height: number
  }

  export interface Theme {
    background: string
    text: string
  }
}
