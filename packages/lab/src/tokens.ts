import { IWidgetTracker } from '@jupyterlab/apputils';
import { Token } from '@lumino/coreutils';
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
