/**
 * ThemePicker.tsx
 * -----------------
 * A React-based JupyterLab widget that allows users to select and apply
 * a Reveal.js (RISE) presentation theme to the currently active notebook.
 *
 * PURPOSE:
 * - Provide a visual theme picker UI for RISE presentations
 * - Update the notebook's `rise.theme` metadata
 * - Persist the change and refresh the RISE preview immediately
 *
 * USAGE:
 * - The widget updates metadata of the currently active notebook only
 */

import { ReactWidget } from '@jupyterlab/apputils';
import { INotebookTracker } from '@jupyterlab/notebook';
import React from 'react';

export class ThemePickerDialog extends ReactWidget {
  constructor(
    private trans: any,
    private notebookTracker: INotebookTracker 
  ) {
    super();
       // CSS hook for styling the theme picker container
    this.addClass('rise-ThemePicker-container');
  }

  private updateMetadata(themeName: string) {
    const current = this.notebookTracker.currentWidget;
    
    if (current && current.model) {
      const model = current.model;
      const riseMetadata = (model.getMetadata('rise') as any) || {};
      const newMetadata = { ...riseMetadata, theme: themeName };
     
      // safe metadata in Notebook model
      model.setMetadata('rise', newMetadata);
      
      //set theme attribut for css styling
      document.body.setAttribute('data-rise-theme', themeName);

      // inject theme css in document 
      this._injectThemeCSS(document, themeName);

      // inject css in RISE-Iframe
      const iframe = document.querySelector('iframe.rise-Preview-iframe') as HTMLIFrameElement | null;
      if (iframe && iframe.contentDocument) {
        const iframeDoc = iframe.contentDocument;
        iframeDoc.body.setAttribute('data-rise-theme', themeName);
        this._injectThemeCSS(iframeDoc, themeName);
      }
      
      void current.context.save();
      this.update();
    }
  }

  /**
   * inject Reveal.js CSS in a document or Iframe
   */
  private _injectThemeCSS(doc: Document, themeName: string) {
    let link = doc.getElementById('rise-reveal-theme-css') as HTMLLinkElement;
    if (!link) {
      link = doc.createElement('link');
      link.id = 'rise-reveal-theme-css';
      link.rel = 'stylesheet';
      doc.head.appendChild(link);
    }
    // use the official CDN for the themes, update it to 4.5.0 for dracula theme
    link.href = `https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.5.0/theme/${themeName}.min.css`;
  }

  protected render(): JSX.Element {
    
    const currentWidget = this.notebookTracker.currentWidget;
    const currentMetadata = (currentWidget?.model?.getMetadata('rise') as any) || {};
    const activeTheme = currentMetadata.theme || 'black'; 
     /** Available Reveal.js themes
     * Each entry defines:
     * - id: theme name
     * - color: preview background
     * - text: preview text color
     * - border: optional border color
     */
    const themes = [
      { id: 'black', color: '#111', text: '#eee' },
      { id: 'white', color: '#fff', text: '#222', border: '#ddd' },
      { id: 'simple', color: '#fff', text: '#000', border: '#eee' },
      { id: 'sky', color: '#add8e6', text: '#000' },
      { id: 'beige', color: '#f7f2d3', text: '#333' },
      { id: 'blood', color: '#222', border: '#800000', text: '#eee' },
      { id: 'night', color: '#111', border: '#e7ad52', text: '#eee' },
      { id: 'moon', color: '#002b36', text: '#93a1a1' },
      { id: 'league', color: '#2b2b2b', border: '#333', text: '#eee' },
      //{ id: 'dracula', color: '#282a36', border: '#bd93f9', text: '#f8f8f2' },
      { id: 'solarized', color: '#fdf6e3', text: '#586e75', border: '#dcd3b6' },
      { id: 'serif', color: '#f0f1eb', text: '#000', border: '#ddd' }
    ];

    return (
      <div className="rise-ThemePicker-container" style={{ padding: '10px' }}>
        <div id="rise-theme-status" style={{ 
          textAlign: 'center', marginBottom: '15px', fontSize: '13px', fontWeight: 'bold', minHeight: '1.2em' 
        }}>
          {this.trans.__('Current theme: %1', activeTheme.toUpperCase())}
        </div>
        
        <div className="rise-ThemePicker-grid" style={{ 
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' 
        }}>
          {themes.map(theme => {
            const isActive = theme.id === activeTheme;
            return (
              <div 
                key={theme.id} 
                className="rise-ThemePicker-item"
                onClick={() => this.updateMetadata(theme.id)}
                style={{ cursor: 'pointer', textAlign: 'center' }}
              >
                <div 
                  style={{ 
                    width: '100%', 
                    height: '50px', 
                    backgroundColor: theme.color, 
                    borderRadius: '6px', 
                    
                    border: isActive 
                      ? '3px solid var(--jp-brand-color1)' 
                      : `1px solid ${theme.border || 'var(--jp-border-color2)'}`,
                    boxShadow: isActive ? '0 0 8px var(--jp-brand-color1)' : 'none',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: theme.text || '#fff',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                  onMouseOver={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = 'var(--jp-brand-color1)';
                  }}
                  onMouseOut={(e) => {
                    if (!isActive) e.currentTarget.style.borderColor = theme.border || 'var(--jp-border-color2)';
                  }}
                > /* Titel Text */
                  Aa
                </div>
                <div style={{ 
                  marginTop: '5px', 
                  fontSize: '10px', 
                  fontWeight: isActive ? 'bold' : 'normal',
                  color: isActive ? 'var(--jp-brand-color1)' : 'inherit'
                }}>
                  {theme.id.toUpperCase()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}