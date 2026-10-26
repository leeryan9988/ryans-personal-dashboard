"""Offline English-to-Chinese fallback for the GitHub-hosted news workflow.

Argos Translate 1.11.0 is pinned in the workflow. MiniSBD avoids the heavy
optional Stanza/PyTorch stack; the small compatibility stub is never used for
sentence splitting.
"""
from __future__ import annotations

import os
import sys
import types
import threading

os.environ.setdefault("ARGOS_STANZA_AVAILABLE", "false")
os.environ.setdefault("ARGOS_CHUNK_TYPE", "MINISBD")
sys.modules.setdefault("stanza", types.ModuleType("stanza"))

_model_lock = threading.Lock()
_model_ready = False
_model_error: Exception | None = None


def translate_offline(text: str) -> str:
    global _model_ready, _model_error
    if _model_error is not None:
        raise RuntimeError("Offline translation model is unavailable") from _model_error
    import argostranslate.package
    import argostranslate.translate
    with _model_lock:
        if not _model_ready:
            try:
                installed = argostranslate.package.get_installed_packages()
                if not any(p.from_code == "en" and p.to_code == "zh" for p in installed):
                    argostranslate.package.update_package_index()
                    package = next(
                        p for p in argostranslate.package.get_available_packages()
                        if p.from_code == "en" and p.to_code == "zh"
                    )
                    argostranslate.package.install_from_path(package.download())
                _model_ready = True
            except Exception as error:
                _model_error = error
                raise
        result = argostranslate.translate.translate(text, "en", "zh").strip()
    if not any("\u3400" <= char <= "\u9fff" for char in result):
        raise ValueError("Offline translation returned no Chinese text")
    return result
