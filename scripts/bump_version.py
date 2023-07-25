# Copyright (c) Jupyter Development Team.
# Distributed under the terms of the Modified BSD License.

import argparse
import json
import shlex
import sys
from pathlib import Path
from subprocess import check_output, run

from packaging.version import parse

LERNA_CMD = "jlpm run lerna version --no-push --force-publish --no-git-tag-version"


def install_dependencies() -> None:
    pkgs = []
    try:
        import hatch
    except ImportError:
        pkgs.append("hatch")
    try:
        import jupyterlab
    except ImportError:
        pkgs.append("jupyterlab~=4.0")
    
    if pkgs:
        run([sys.executable, "-m", "pip", "install"] + pkgs)


def bump(force: bool, spec: str) -> None:
    install_dependencies()

    HERE = Path(__file__).parent.parent.resolve()
    output = check_output(
        shlex.split("git status --porcelain"), cwd=HERE, encoding="utf-8"
    )
    if len(output) > 0:
        raise Exception("Must be in a clean git state with no untracked files")

    run(
        [sys.executable, "-m", "hatch", "version", spec], cwd=HERE, encoding="utf-8", check=True
    )

    version = parse(
        # Output maybe multi-lines if build dependencies needs to be installed.
        check_output(
            [sys.executable, "-m", "hatch", "version"], cwd=HERE, encoding="utf-8"
        ).strip("\n").split("\n")[-1]
    )

    # convert the Python version
    js_version = f"{version.major}.{version.minor}.{version.micro}"
    if version.pre is not None:
        p, x = version.pre
        p = p.replace("a", "alpha").replace("b", "beta")
        js_version += f"-{p}.{x}"

    # bump the JS packages
    lerna_cmd = f"{LERNA_CMD} {js_version}"
    if force:
        lerna_cmd += " --yes"
    run(shlex.split(lerna_cmd), cwd=HERE, check=True)

    path = HERE.joinpath("package.json")
    if path.exists():
        with path.open(mode="r") as f:
            data = json.load(f)

        data["version"] = js_version

        with path.open(mode="w") as f:
            json.dump(data, f, indent=2)

    else:
        raise FileNotFoundError(f"Could not find package.json under dir {path!s}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser("bump_version", "Bump package version")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("spec")

    args = parser.parse_args()
    bump(args.force, args.spec)
