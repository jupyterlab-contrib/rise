import { IWidgetTracker } from '@jupyterlab/apputils';
import { Token } from '@lumino/coreutils';
import { ISignal } from '@lumino/signaling';
import type { RisePreview } from './preview';

/**
 * A class that tracks Rise Preview widgets.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IRisePreviewTracker extends IWidgetTracker<RisePreview> {}

/**
 * The Rise Preview tracker token.
 */
export const IRisePreviewTracker = new Token<IRisePreviewTracker>(
  'jupyterlab-rise:IRisePreviewTracker'
);

/**
 * RISE Preview document factory interface
 */
export interface IRisePreviewFactory {
  /**
   * Signal emitted when a RISE preview is created.
   */
  readonly widgetCreated: ISignal<IRisePreviewFactory, RisePreview>;
  /**
   * Add a new file type to the RISE preview factory.
   *
   * #### Notes
   * Useful to add file types for jupytext.
   *
   * @param ft File type
   */
  addFileType(ft: string): void;
}

/**
 * RISE Preview factory token.
 */
export const IRisePreviewFactory = new Token<IRisePreviewFactory>(
  'jupyterlab-rise:IRisePreviewFactory'
);
