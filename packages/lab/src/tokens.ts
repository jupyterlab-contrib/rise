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
  'jupyterlab-rise:IRisePreviewTracker',
  'Adds a tracker for RISE slides preview widgets.'
);

/**
 *
 */
export interface IRisePreviewFactory {
  readonly widgetCreated: ISignal<IRisePreviewFactory, RisePreview>;
  addFileType(ft: string): void;
}

/**
 *
 */
export const IRisePreviewFactory = new Token<IRisePreviewFactory>(
  'jupyterlab-rise:IRisePreviewFactory',
  'Customize the RISE slides preview factory.'
);
