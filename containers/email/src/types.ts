export interface IParams {
  /**
   * @TJS-type email
   */
  to: string[];
  subject: string;
  attachments?: string[];
  /**
   * @TJS-type markdown
   */
  body: string;
}
