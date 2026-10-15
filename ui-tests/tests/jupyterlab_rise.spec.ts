import { expect, test } from '@jupyterlab/galata';

/**
 * Don't load JupyterLab webpage before running the tests.
 * This is required to ensure we capture all log messages.
 */
test.use({ autoGoto: false });

test('should emit an activation console message', async ({ page }) => {
  const logs: string[] = [];

  page.on('console', message => {
    logs.push(message.text());
  });

  await page.goto();

  expect(
    logs.filter(s => s === 'JupyterLab extension jupyterlab-rise is activated!')
  ).toHaveLength(1);
});

test('should render ipywidgets in the presenter', async ({
  baseURL,
  context,
  page,
  tmpPath
}) => {
  const notebook = {
    cells: [
      {
        cell_type: 'code',
        execution_count: null,
        metadata: {},
        outputs: [],
        source: 'import ipywidgets\nipywidgets.IntSlider(value=3)'
      }
    ],
    metadata: {
      kernelspec: {
        display_name: 'Python 3 (ipykernel)',
        language: 'python',
        name: 'python3'
      }
    },
    nbformat: 4,
    nbformat_minor: 5
  };
  await page.contents.uploadContent(
    JSON.stringify(notebook),
    'text',
    `${tmpPath}/widgets.ipynb`
  );

  // The presenter is a separate application, so open it in its own page.
  const presenter = await context.newPage();
  await presenter.goto(`${baseURL}/rise/${tmpPath}/widgets.ipynb`);
  const cell = presenter.locator('.jp-Cell').first();
  await cell.locator('.jp-InputArea-editor').click();
  await presenter.keyboard.press('Control+Enter');

  // The widget manager must load in the presenter (#119); without it the
  // output falls back to the widget's text representation.
  await expect(cell.locator('.jp-OutputArea .widget-slider')).toBeVisible({
    timeout: 60000
  });
  await expect(cell.locator('.jp-OutputArea')).not.toContainText('IntSlider(');
});
