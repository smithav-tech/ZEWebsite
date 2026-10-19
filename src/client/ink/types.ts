/** A word the line writes beside its doodle, faded in once enough of the stroke is down. */
export interface InkLabel {
  /** position in the scene's own box */
  x: number;
  y: number;
  text: string;
  /** font size in scene units (never rendered below 11px) */
  size: number;
  /** fraction of the scene's stroke drawn before the label shows (default 1) */
  at?: number;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  /** CSS text-decoration */
  deco?: string;
}

/** One doodle: a single continuous stroke in a w x h box. */
export interface InkScene {
  w: number;
  h: number;
  /** absolute M + C commands only */
  d: string;
  /**
   * How many of the first C segments are a lead-in from the top-right corner.
   * The line only takes it when it arrives down the right margin (a single
   * column, where the copy sits above the drawing); beside the copy the link
   * joins the drawing where the lead-in ends.
   */
  lead?: number;
  labels?: InkLabel[];
  /** an image of the zeroearth wordmark that takes over once the stroke is done: x, y, width, height */
  logo?: [number, number, number, number];
}
