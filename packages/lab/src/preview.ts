import { IFrame, ToolbarButton, Toolbar } from '@jupyterlab/apputils';

import { PageConfig, URLExt } from '@jupyterlab/coreutils';

import {
  ABCWidgetFactory,
  DocumentRegistry,
  DocumentWidget
} from '@jupyterlab/docregistry';

import { INotebookModel } from '@jupyterlab/notebook';

import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import { refreshIcon } from '@jupyterlab/ui-components';

import { CommandRegistry } from '@lumino/commands';

import { PromiseDelegate } from '@lumino/coreutils';

import { DisposableSet, IDisposable } from '@lumino/disposable';

import { Message } from '@lumino/messaging';

import { ISignal, Signal } from '@lumino/signaling';

import { Widget } from '@lumino/widgets';

import { fullScreenIcon, RISEIcon } from './icons';
import { IRisePreviewFactory } from './tokens';

/**
 * A DocumentWidget that shows a Rise preview in an IFrame.
 */
export class RisePreview extends DocumentWidget<IFrame, INotebookModel> {
  /**
   * Instantiate a new RisePreview.
   * @param options The RisePreview instantiation options.
   */
  constructor(options: RisePreview.IOptions) {
    super({
      ...options,
      content: new IFrame({
        sandbox: [
          'allow-same-origin',
          'allow-scripts',
          'allow-downloads',
          'allow-modals',
          'allow-popups'
        ]
      })
    });
    // Uncomment in dev mode to receive logs from the iframe
    //Private.setupLog();

    this._ready = new PromiseDelegate<void>();

    const { getRiseUrl, context, renderOnSave, translator } = options;
    this.getRiseUrl = getRiseUrl;
    this._path = context.path;

    const trans = (translator ?? nullTranslator).load('rise');

    this.content.title.icon = RISEIcon;

    this._renderOnSave = renderOnSave ?? false;

    context.pathChanged.connect(() => {
      this.path = context.path;
    });

    const reloadButton = new ToolbarButton({
      icon: refreshIcon,
      tooltip: trans.__('Reload Preview'),
      onClick: () => {
        this.reload();
      }
    });

    const renderOnSaveCheckbox = new Private.CheckBox({
      checked: this._renderOnSave,
      onChange: (event: Event) => {
        this._renderOnSave = (event.target as any)?.checked ?? false;
      },
      translator
    });

    this.toolbar.addItem(
      'fullscreen',
      new ToolbarButton({
        icon: fullScreenIcon,
        tooltip: trans.__('Open the slideshow in full screen'),
        onClick: () => {
          options.commands.execute('RISE:fullscreen-plugin');
        }
      })
    );

    if (context) {
      this.toolbar.addItem('renderOnSave', renderOnSaveCheckbox);
      void context.ready.then(() => {
        this.setActiveCellIndex(0)
          .then(() => this._ready.resolve())
          .catch(e => this._ready.reject(e));

        context.fileChanged.connect(() => {
          if (this.renderOnSave) {
            this.reload();
          }
        });
      });
    }

    this.toolbar.addItem('spacer', Toolbar.createSpacerItem());

    this.toolbar.addItem('reload', reloadButton);
  }

  /**
   * Promise that resolves when the slideshow is ready
   */
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  get iframe(): HTMLIFrameElement | null {
    return this.content.node.querySelector('iframe');
  }

  /**
   * Dispose the preview widget.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    super.dispose();
    Signal.clearData(this);
  }

  /**
   * Reload the preview.
   */
  reload(): void {
    const iframe = this.content.node.querySelector('iframe')!;
    if (iframe.contentWindow) {
      iframe.contentWindow.location.reload();
    }
  }

  /**
   * Whether the preview reloads when the context is saved.
   */
  get renderOnSave(): boolean {
    return this._renderOnSave;
  }

  async setActiveCellIndex(index: number, reload = true): Promise<void> {
    const iframe = this.iframe!;

    if (reload) {
      this.content.url = this.getRiseUrl(this.path, index);
      await this._waitForIFrame(iframe);
    } else {
      if (iframe.contentWindow) {
        iframe.contentWindow.history.pushState(
          null,
          '',
          this.getRiseUrl(this.path, index)
        );
        return Promise.resolve();
      }
      return Promise.reject('No content.');
    }
  }

  protected get path(): string {
    return this._path;
  }
  protected set path(v: string) {
    if (v !== this._path) {
      this._path = v;
      this.setActiveCellIndex(0);
    }
  }

  private async _waitForIFrame(iframe: HTMLIFrameElement): Promise<boolean> {
    const ready = new PromiseDelegate<boolean>();

    const setReady = () => {
      iframe.contentWindow?.removeEventListener('load', setReady);

      const waitForReveal = setInterval(() => {
        if (iframe.contentDocument?.querySelector('.reveal')) {
          clearInterval(waitForReveal);
          ready.resolve(true);
        }
      }, 500);
    };

    if (iframe.contentDocument?.readyState === 'complete') {
      setReady();
    } else {
      iframe.contentWindow?.addEventListener('load', setReady);
    }

    return ready.promise;
  }

  protected getRiseUrl: (path: string, index?: number) => string;
  private _ready: PromiseDelegate<void>;
  private _renderOnSave: boolean;
  private _path: string;
}

/**
 * A namespace for RisePreview statics.
 */
export namespace RisePreview {
  export const FACTORY_NAME = 'rise';

  /**
   * Instantiation options for `RisePreview`.
   */
  export interface IOptions
    extends DocumentWidget.IOptionsOptionalContent<IFrame, INotebookModel> {
    /**
     * Application commands registry
     */
    commands: CommandRegistry;
    /**
     * The Rise URL function.
     */
    getRiseUrl: (path: string, index?: number) => string;

    /**
     * Whether to reload the preview on context saved.
     */
    renderOnSave?: boolean;
  }

  /**
   * Generate the URL required to open a file as RISE slideshow.
   *
   * @param path File path
   * @param activeCellIndex Active cell index
   * @returns URL to open
   */
  export function getRiseUrl(path: string, activeCellIndex?: number): string {
    const baseUrl = PageConfig.getBaseUrl();
    let url = `${baseUrl}rise/${path}`;
    if (typeof activeCellIndex === 'number') {
      url += URLExt.objectToQueryString({ activeCellIndex });
    }
    return url;
  }

  /**
   * RISE Preview document factory token implementation.
   */
  export class FactoryToken implements IRisePreviewFactory {
    constructor({
      commands,
      docRegistry,
      fileTypes,
      translator
    }: {
      commands: CommandRegistry;
      docRegistry: DocumentRegistry;
      fileTypes?: string[];
      translator?: ITranslator;
    }) {
      this._commands = commands;
      this._docRegistry = docRegistry;
      this._fileTypes = fileTypes ?? ['notebook'];
      this._translator = translator ?? nullTranslator;

      this._updateFactory();
    }

    /**
     * Add a new file type to the RISE preview factory.
     *
     * #### Notes
     * Useful to add file types for jupytext.
     *
     * @param ft File type
     */
    addFileType(ft: string): void {
      if (!this._fileTypes.includes(ft)) {
        this._fileTypes.push(ft);
        this._updateFactory();
      }
    }

    /**
     * Signal emitted when a RISE preview is created.
     */
    get widgetCreated(): ISignal<IRisePreviewFactory, RisePreview> {
      return this._widgetCreated;
    }

    private _updateFactory(): void {
      if (this._disposeFactory) {
        this._disposeFactory.dispose();
        this._disposeFactory = null;
      }

      const trans = this._translator.load('rise');
      const factory = new RisePreviewFactory(getRiseUrl, this._commands, {
        name: FACTORY_NAME,
        label: trans.__('Rise Slides'),
        fileTypes: this._fileTypes,
        modelName: 'notebook'
      });

      factory.widgetCreated.connect((_, args) => {
        this._widgetCreated.emit(args);
      }, this);

      this._disposeFactory = DisposableSet.from([
        this._docRegistry.addWidgetFactory(factory),
        factory
      ]);
    }

    private _commands: CommandRegistry;
    private _disposeFactory: IDisposable | null = null;
    private _docRegistry: DocumentRegistry;
    private _fileTypes: string[];
    private _translator: ITranslator;
    private _widgetCreated = new Signal<FactoryToken, RisePreview>(this);
  }
}

/**
 * RISE Preview widget factory
 */
export class RisePreviewFactory extends ABCWidgetFactory<
  RisePreview,
  INotebookModel
> {
  defaultRenderOnSave = false;

  constructor(
    private getRiseUrl: (path: string) => string,
    private commands: CommandRegistry,
    options: DocumentRegistry.IWidgetFactoryOptions<RisePreview>
  ) {
    super(options);
  }

  protected createNewWidget(
    context: DocumentRegistry.IContext<INotebookModel>
  ): RisePreview {
    return new RisePreview({
      context,
      commands: this.commands,
      getRiseUrl: this.getRiseUrl,
      renderOnSave: this.defaultRenderOnSave
    });
  }
}

namespace Private {
  /**
   * Namespace for the checkbox widget
   */
  export namespace CheckBox {
    /**
     * Constructor options for the checkbox
     */
    export interface IOptions {
      /**
       * Checkbox initial value
       */
      checked?: boolean;
      /**
       * Callback on checked status changes
       */
      onChange?: (ev: Event) => void;
      /**
       * Translator
       */
      translator?: ITranslator;
    }
  }

  /**
   * Simple checkbox
   */
  export class CheckBox extends Widget {
    constructor(options: CheckBox.IOptions = {}) {
      const trans = (options.translator ?? nullTranslator).load('rise');
      const node = document.createElement('label');
      node.insertAdjacentHTML(
        'afterbegin',
        `<input name="renderOnSave" type="checkbox"></input>${trans.__(
          'Render on Save'
        )}`
      );
      super({ node });
      this.input = node.childNodes.item(0) as HTMLInputElement;
      this.checked = options.checked ?? false;
      const noOp = () => {
        // no-op
      };
      this.onChange = options.onChange ?? noOp;
    }

    /**
     * Checkbox status
     */
    get checked(): boolean {
      return this.input.checked;
    }
    set checked(v: boolean) {
      this.input.checked = v;
    }

    /**
     * Checkbox status callback
     */
    protected onChange: (event: Event) => void;

    protected onAfterAttach(msg: Message): void {
      super.onAfterAttach(msg);
      this.input.addEventListener('change', this.onChange);
    }

    protected onBeforeDetach(msg: Message): void {
      this.input.removeEventListener('change', this.onChange);
      super.onBeforeDetach(msg);
    }

    protected input: HTMLInputElement;
  }

  export function setupLog(): void {
    window.onmessage = (event: MessageEvent<any>) => {
      //console.log("EVENT: ", event);

      switch (event.data?.level) {
        case 'debug':
          console.debug(...(event.data?.msg ?? []));
          break;

        case 'info':
          console.info(...(event.data?.msg ?? []));
          break;

        case 'warn':
          console.warn(...(event.data?.msg ?? []));
          break;

        case 'error':
          console.error(...(event.data?.msg ?? []));
          break;

        default:
          console.log(event);
          break;
      }
    };
  }
}
