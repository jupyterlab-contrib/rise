from .app import RiseApp


def _load_jupyter_server_extension(serverapp):
    serverapp.log.info("_load_jp_sever_ext")
    extension = RiseApp()
    extension.serverapp = serverapp
    extension.load_config_file()
    extension.update_config(serverapp.config)
    extension.parse_command_line(serverapp.extra_args)
    extension.initialize()

    serverapp.log.info(serverapp.handlers)
