from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any


def _config_dir() -> Path:
    xdg = os.environ.get("XDG_CONFIG_HOME")
    if xdg:
        return Path(xdg) / "owp-pool"
    return Path.home() / ".config" / "owp-pool"


def config_path() -> Path:
    return _config_dir() / "config.json"


@dataclass
class LocalConfig:
    server: str | None = None
    worker_id: str | None = None
    token: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {"server": self.server, "worker_id": self.worker_id, "token": self.token}

    @staticmethod
    def from_dict(data: dict[str, Any]) -> "LocalConfig":
        return LocalConfig(server=data.get("server"), worker_id=data.get("worker_id"), token=data.get("token"))


def load_config() -> LocalConfig:
    path = config_path()
    if not path.exists():
        return LocalConfig()
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        return LocalConfig()
    return LocalConfig.from_dict(data)


def save_config(cfg: LocalConfig) -> None:
    path = config_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(cfg.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
