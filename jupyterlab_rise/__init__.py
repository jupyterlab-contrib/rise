from .app import RiseApp
from .serverextension import _load_jupyter_server_extension
from ._version import __version__


def _jupyter_labextension_paths():
    return [{"src": "labextension", "dest": "jupyterlab-rise"}]


def _jupyter_server_extension_points():
    return [{"module": "jupyterlab_rise", "app": RiseApp}]


load_jupyter_server_extension = _load_jupyter_server_extension
