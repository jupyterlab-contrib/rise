# jupyterlab_rise

[![Extension status](https://img.shields.io/badge/status-draft-critical 'Not yet working')](https://jupyterlab-contrib.github.io/index.html) [![Github Actions Status](https://github.com/jupyterlab-contrib/rise/workflows/Build/badge.svg)](https://github.com/jupyterlab-contrib/rise/actions/workflows/build.yml) [![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/jupyterlab-contrib/rise/main?urlpath=lab/tree/examples/README.ipynb) [![PyPI](https://img.shields.io/pypi/v/jupyterlab-rise)](https://pypi.org/project/jupyterlab-rise/)

RISE: "Live" Reveal.js JupyterLab Slideshow extension.

## Requirements

- JupyterLab >= 4.0.0

## Install

To install the extension with pip, execute:

```bash
pip install jupyterlab_rise
```

For conda, execute:

```bash
conda install conda-forge::jupyterlab_rise
```

For JupyterLab 3.x, install version prior to 0.40.0:

```bash
pip install "jupyterlab_rise<0.40.0"
```

## Uninstall

To remove the extension, execute:

```bash
pip uninstall jupyterlab_rise
```

## Usage
To mark a cell as a new slide, sub-slide or fragment, open the property inspector and choose the slide type:

![screenshot](https://private-user-images.githubusercontent.com/22673372/271373535-b1d368b2-4f2e-47fd-a2f1-be11417b7345.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjc4ODA0MzEsIm5iZiI6MTcyNzg4MDEzMSwicGF0aCI6Ii8yMjY3MzM3Mi8yNzEzNzM1MzUtYjFkMzY4YjItNGYyZS00N2ZkLWEyZjEtYmUxMTQxN2I3MzQ1LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDEwMDIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQxMDAyVDE0NDIxMVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTFhMWM4NGRlZGZlODBkZjgxNmEwZWU2MDM5YjBjMTk0ZmQyNDA3ZTcyZjljNGI3ODg0MjJjMzMxNmUzMGNhYmMmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.b3tYFGDSl5h7UKF4PkEdS1JdqwvqZg0BEbr1AWzIp0g "screenshot")

Use `Ctrl+R` to render the current notebook as a slidehow:

![screenshot](https://private-user-images.githubusercontent.com/22673372/271375720-9c0035a2-7afb-4d78-a629-c78a6cd348d5.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3Mjc4ODA0MzEsIm5iZiI6MTcyNzg4MDEzMSwicGF0aCI6Ii8yMjY3MzM3Mi8yNzEzNzU3MjAtOWMwMDM1YTItN2FmYi00ZDc4LWE2MjktYzc4YTZjZDM0OGQ1LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNDEwMDIlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjQxMDAyVDE0NDIxMVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWNkZjZkM2FhMTU2YjA0MzVmMWU0MDg0MGI3MWU4OWI5YTE4Y2RlZDliZTBiYjZkOWViYjY3MmY0NjQ3OTIyNmMmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.loGjl5_mgqcqYFoiX7KveAqNUkpKu0kS-uPZX9nxK-I "screenshot")

## Troubleshoot

If you are seeing the frontend extension, but it is not working, check
that the server extension is enabled:

```bash
jupyter server extension list
```

If the server extension is installed and enabled, but you are not seeing
the frontend extension, check the frontend extension is installed:

```bash
jupyter labextension list
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

The `jlpm` command is JupyterLab's pinned version of
[yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use
`yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
# Change directory to the jupyterlab_rise directory
# Install package in development mode
pip install -e ".[test]"
# Link your development version of the extension with JupyterLab
jupyter labextension develop . --overwrite
# Server extension must be manually installed in develop mode
jupyter server extension enable jupyterlab_rise
# Rebuild extension Typescript source after making changes
jlpm build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
# Server extension must be manually disabled in develop mode
jupyter server extension disable jupyterlab_rise
pip uninstall jupyterlab_rise
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jupyterlab-rise` within that folder.

### Testing the extension

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
