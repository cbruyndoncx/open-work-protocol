from __future__ import annotations

import os
from pathlib import Path


_DEFAULT_ENV_FILES = (".env", ".env.local", "env.local", "secrets.env")


def _strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
        return value[1:-1]
    return value


def load_env(*, search_dir: Path | None = None) -> Path | None:
    """
    Loads env vars from a local env file into os.environ (does not override existing vars).

    Search order:
    1) $OWP_ENV_FILE (path, relative or absolute)
    2) .env, .env.local, env.local, secrets.env (in search_dir / cwd)
    """
    base = search_dir or Path.cwd()

    candidates: list[Path] = []
    explicit = os.environ.get("OWP_ENV_FILE")
    if explicit:
        p = Path(explicit)
        candidates.append(p)
        if not p.is_absolute():
            candidates.append(base / p)

    candidates.extend(base / name for name in _DEFAULT_ENV_FILES)

    for path in candidates:
        try:
            if not path.exists() or not path.is_file():
                continue
            for raw in path.read_text(encoding="utf-8").splitlines():
                line = raw.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                key, val = line.split("=", 1)
                key = key.strip()
                if not key:
                    continue
                os.environ.setdefault(key, _strip_quotes(val))
            return path
        except OSError:
            continue

    return None

