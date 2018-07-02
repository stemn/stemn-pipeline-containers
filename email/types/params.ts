export interface IParams {
  to: string[];
  subject: string;
  attachments?: string[];
  /**
   * @TJS-type markdown
   */
  body: string;
}
