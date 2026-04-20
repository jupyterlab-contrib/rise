/**
 * 
 * Index.ts
 * 
 * Purpose:
 *   - Provides commands, toolbar buttons, and UI integration for Reveal.js
 *     slideshow presentations inside JupyterLab.
 *   - Supports theme selection
 *
 * Usage:
 *   - Loads automatically as a JupyterLab extension.
 *   - Users can open notebooks in RISE mode, apply themes
 *
 * Notes:
 *   - Depends on `ThemePickerDialog` for theme selection.
 *   - Integrates with notebook metadata to persist RISE settings.
 */
import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  CommandToolbarButton,
  ICommandPalette,
  showDialog,
  Dialog,
  WidgetTracker
} from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import {
  INotebookModel,
  INotebookTracker,
  Notebook,
  NotebookPanel
} from '@jupyterlab/notebook';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

import { ITranslator, nullTranslator } from '@jupyterlab/translation';

import { toArray } from '@lumino/algorithm';

import { ReadonlyPartialJSONObject } from '@lumino/coreutils';

import { fullScreenIcon, RISEIcon } from './icons';

import { RisePreview } from './preview';

import { IRisePreviewFactory, IRisePreviewTracker } from './tokens';

export { IRisePreviewFactory, IRisePreviewTracker } from './tokens';

// new class fpr the Theme pcikcer dialog:
import { ThemePickerDialog } from './ThemePicker';

import { paletteIcon } from '@jupyterlab/ui-components';

import '../style/index.css';
/**
 * Command IDs namespace for JupyterLab RISE extension
 */
namespace CommandIDs {
  /**
   * Open the current notebook in a new browser tab
   */
  export const openRise = 'RISE:slideshow';
  export const riseFullScreen = 'RISE:fullscreen-plugin';
  /**
   * Open the current notebook in a IFrame within JupyterLab
   */
  export const risePreview = 'RISE:preview';
  /**
   * Set the slide attribute of a cell
   */
  export const riseSetSlideType = 'RISE:set-slide-type';
/* set the theme*/ 
  export const riseSetTheme = 'RISE:set-theme';

  // picks the theme
export const openThemePicker = 'RISE:theme-picker';

}

const factory: JupyterFrontEndPlugin<IRisePreviewFactory> = {
  id: 'jupyterlab-rise:factory',
  provides: IRisePreviewFactory,
  optional: [ITranslator],
  activate: (
    app: JupyterFrontEnd,
    translator: ITranslator | null
  ): IRisePreviewFactory => {
    const { commands, docRegistry } = app;
    return new RisePreview.FactoryToken({
      commands,
      docRegistry,
      translator: translator ?? undefined
    });
  }
};

/**
 * Open the notebook with RISE.
 */
const plugin: JupyterFrontEndPlugin<IRisePreviewTracker> = {
  id: 'jupyterlab-rise:plugin',
  autoStart: true,
  requires: [IRisePreviewFactory],
  optional: [
    INotebookTracker,
    ICommandPalette,
    ILayoutRestorer,
    ISettingRegistry,
    ITranslator
  ],
  provides: IRisePreviewTracker,
  activate: (
    app: JupyterFrontEnd,
    factory: IRisePreviewFactory,
    notebookTracker: INotebookTracker | null,
    palette: ICommandPalette | null,
    restorer: ILayoutRestorer | null,
    settingRegistry: ISettingRegistry | null,
    translator: ITranslator | null
  ): IRisePreviewTracker => {
    console.log('JupyterLab extension jupyterlab-rise is activated!');

    // Create a widget tracker for Rise Previews.
    const tracker = new WidgetTracker<RisePreview>({
      namespace: 'rise'
    });

    if (!notebookTracker) {
      return tracker;
    }

    const { commands, shell } = app;
    const trans = (translator ?? nullTranslator).load('rise');

    let settings: ISettingRegistry.ISettings | null = null;
    if (settingRegistry) {
      settingRegistry.load(plugin.id).then(config => {
        settings = config;
      });
    }

    if (restorer) {
      restorer.restore(tracker, {
        // Need to modify to handle auto full screen
        command: 'docmanager:open',
        args: panel => ({
          path: panel.context.path,
          factory: RisePreview.FACTORY_NAME
        }),
        name: panel => panel.context.path,
        when: app.serviceManager.ready
      });
    }

    function getCurrent(args: ReadonlyPartialJSONObject): NotebookPanel | null {
      const widget = notebookTracker?.currentWidget ?? null;
      const activate = args['activate'] !== false;

      if (activate && widget) {
        shell.activateById(widget.id);
      }

      return widget;
    }

    function isEnabled(): boolean {
      return (
        notebookTracker?.currentWidget !== null &&
        notebookTracker?.currentWidget === shell.currentWidget
      );
    }

    factory.widgetCreated.connect((sender, widget) => {
      // Notify the widget tracker if restore data needs to update.
      widget.context.pathChanged.connect(() => {
        void tracker.save(widget);
      });
      // Add the notebook panel to the tracker.
      void tracker.add(widget);
    });

    tracker.widgetAdded.connect((sender, widget) => {
      widget.ready.then(() => widget.iframe?.focus());
    });

    commands.addCommand(CommandIDs.openRise, {
      label: args => (args.toolbar ? '' : trans.__('Open as Reveal Slideshow')),
      caption: trans.__(
        'Open the current notebook in a new browser tab as an RevealJS slideshow.'
      ),
      execute: async () => {
        const current = notebookTracker.currentWidget;
        if (!current) {
          return;
        }
        await current.context.save();
        window.open(
          RisePreview.getRiseUrl(
            current.context.path,
            current.content.activeCellIndex
          )
        );
      },
      isEnabled
    });

    commands.addCommand(CommandIDs.risePreview, {
      label: args =>
        args.toolbar ? '' : trans.__('Render as Reveal Slideshow'),
      caption: trans.__('Render the current notebook as Reveal Slideshow'),
      icon: RISEIcon,
      execute: async args => {
        const current = getCurrent(args);
        let context: DocumentRegistry.IContext<INotebookModel>;
        if (current) {
          context = current.context;
          await context.save();

          const widget: RisePreview = await commands.execute(
            'docmanager:open',
            {
              path: context.path,
              factory: RisePreview.FACTORY_NAME,
              options: {
                mode: 'split-right'
              }
            }
          );

          const updateActiveIndex = (notebook: Notebook) => {
            widget.setActiveCellIndex(notebook.activeCellIndex, false);
          };
          widget.setActiveCellIndex(current.content.activeCellIndex);
          current.content.activeCellChanged.connect(updateActiveIndex);

          widget.disposed.connect(() => {
            current.content.activeCellChanged.disconnect(updateActiveIndex);
          });

          if (args['fullscreen'] === true) {
            widget.ready
              .then(() => {
                showDialog({
                  title: trans.__('Switch to full screen'),
                  body: trans.__(
                    'The slideshow is set to automatically open in full screen. Your web browser requires your confirmation to do so.'
                  )
                }).then(result => {
                  if (result.button.accept) {
                    commands.execute(CommandIDs.riseFullScreen, {
                      id: widget.id
                    });
                  }
                });
              })
              .catch(reason => {
                console.log(reason);
              });
          }
        }
      },
      isEnabled
    });

    commands.addCommand(CommandIDs.riseFullScreen, {
      label: trans.__('Full screen slideshow'),
      caption: trans.__('Toggle full screen the current active slideshow'),
      icon: fullScreenIcon,
      execute: async args => {
        if (args['id']) {
          app.shell.activateById(args['id'] as string);
        }
        const current = args['id']
          ? toArray(app.shell.widgets('main')).find(
              widget => widget.id === args['id']
            )
          : app.shell.currentWidget;

        if (current && tracker.has(current)) {
          const iframe = (current as RisePreview).iframe;
          if (iframe) {
            if (
              !document.fullscreenElement &&
              !iframe.contentDocument?.fullscreenElement
            ) {
              (current as RisePreview).ready.then(() => {
                iframe?.contentWindow?.document
                  .querySelector('div.reveal')
                  ?.requestFullscreen();
              });
            } else {
              if (document.exitFullscreen) {
                await document.exitFullscreen();
              }
            }
            iframe.focus();
          }
        }
      },
      isEnabled: () =>
        !!app.shell.currentWidget && tracker.has(app.shell.currentWidget)
    });

    commands.addCommand(CommandIDs.riseSetSlideType, {
      label: args => trans.__('Toggle slideshow %1 type', args['type']),
      caption: args =>
        trans.__('(Un)set active cell as a %1 cell', args['type']),
      execute: args => {
        const value = args['type'];
        const current = app.shell.currentWidget;
        if (current && notebookTracker.has(current)) {
          const cellModel = (current as NotebookPanel).content.activeCell
            ?.model;
          if (cellModel) {
            const currentValue =
              (cellModel.getMetadata('slideshow') as
                | ReadonlyPartialJSONObject
                | undefined) ?? {};
            if (value !== currentValue['slide_type']) {
              const newValue = { ...currentValue };
              if (value) {
                newValue['slide_type'] = value;
              } else {
                delete newValue['slide_type'];
              }

              if (Object.keys(newValue).length > 0) {
                cellModel.setMetadata('slideshow', newValue);
              } else {
                cellModel.deleteMetadata('slideshow');
              }
            }
          }
        }
      },
      isToggled: args => {
        const value = args['type'];
        const current = app.shell.currentWidget;
        if (current && notebookTracker.has(current)) {
          const cellModel = (current as NotebookPanel).content.activeCell
            ?.model;
          if (cellModel) {
            const currentValue =
              (cellModel.getMetadata('slideshow') as
                | ReadonlyPartialJSONObject
                | undefined) ?? {};
            return currentValue['slide_type'] === value && !!value;
          }
        }

        return false;
      },
      isEnabled: args =>
        ['slide', 'subslide', 'fragment', 'skip', 'notes'].includes(
          (args['type'] as string) ?? ''
        )
    });

    /*new theme command*/

  commands.addCommand(CommandIDs.riseSetTheme, {
  label: args => trans.__('Set Slideshow Theme: %1', args['theme']),
  execute: args => {
    const themeName = args['theme'] as string;
    const current = notebookTracker.currentWidget;
    if (current && themeName) {
      const model = current.model;
      if (model) {
        
        const riseMetadata = (model.getMetadata('rise') as any) || {};
        
        riseMetadata['theme'] = themeName;
        model.setMetadata('rise', riseMetadata);
        
        
        showDialog({
          title: trans.__('Theme Updated'),
          body: trans.__(`Theme set to "${themeName}". Please save and refresh to apply changes.`),
          buttons: [Dialog.okButton()]
        });
      }
    }
    document.body.classList.add('rise-enabled');
  }
});


// Inside the activate function
commands.addCommand(CommandIDs.openThemePicker, {
  label: trans.__('Select RISE Theme'),
  caption: trans.__('Open a visual dialog to choose a Reveal.js theme'),
execute: async () => {
  const current = notebookTracker.currentWidget;
  if (!current) return;

  await showDialog({ 
    title: trans.__('Choose a Slideshow Theme'),
    body: new ThemePickerDialog(trans, notebookTracker), 
    buttons: [Dialog.okButton({ label: trans.__('Close') })]
  });
}
});

    notebookTracker.widgetAdded.connect(
      async (sender: INotebookTracker, panel: NotebookPanel) => {
        panel.toolbar.insertBefore(
          'kernelName',
          'RISE-button',
          new CommandToolbarButton({
            commands,
            id: CommandIDs.risePreview,
            args: { toolbar: true }
          })
        );

        // Don't trigger auto launch in stand-alone Rise application.
        if (app.name !== 'Rise') {
          await panel.context.ready;
          const riseData = (panel.content.model?.getMetadata('rise') as any) || {};
          const initialTheme = riseData.theme || 'black';
        document.body.setAttribute('data-rise-theme', initialTheme);

          let autolaunch: boolean =
            (panel.content.model?.getMetadata('rise') ?? {})['autolaunch'] ??
            false;
          if (settings) {
            // @ts-expect-error unknown type
            autolaunch |= settings.get('autolaunch').composite;
          }

          if (autolaunch) {
            await commands.execute(CommandIDs.risePreview, {
              fullscreen: true
            });
          }
        }
        // Include a second Button for in the toolbar for theme:
panel.toolbar.insertBefore(
  'kernelName',
  'RISE-theme-button',
  new CommandToolbarButton({
    commands,
    id: CommandIDs.openThemePicker,
    icon: paletteIcon, // colorpalette-Icon
    caption: trans.__('Select RISE Theme') // Tooltip
  })
);


      }


    );

    if (palette) {
      const category = 'Notebook Operations';
      [CommandIDs.openRise, CommandIDs.risePreview].forEach(command => {
        palette.addItem({ command, category });
      });
    }

    return tracker;
  }
};

export default [factory, plugin];
