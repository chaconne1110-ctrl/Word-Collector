#!/usr/bin/env python3
"""Attach Word Collector native iOS bridges to a Capacitor 8 SPM project.

Call after 'npx cap add ios --packagemanager SPM' and 'npx cap sync ios'.
The stock AppDelegate.swift is already a compiled member of the App target.
"""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[2]
app = root / "ios/App/App"
delegate = app / "AppDelegate.swift"
storyboard = app / "Base.lproj/Main.storyboard"
native = root / "scripts/ios/NativeBridge.swift"
if not delegate.is_file() or not storyboard.is_file():
    raise SystemExit("Create iOS platform first: npx cap add ios --packagemanager SPM")
original = delegate.read_text(encoding="utf-8")
marker = "// iOS local plugins. The bundle is generated from the Capacitor 8 SPM template."
if marker not in original:
    delegate.write_text(original.rstrip() + "\n\n" + native.read_text(encoding="utf-8"), encoding="utf-8")
story = storyboard.read_text(encoding="utf-8")
if 'customClass="WordCollectorViewController"' not in story:
    target = r'customClass="CAPBridgeViewController"(?:\s+customModule="[^"]*")?'
    story, count = re.subn(target, 'customClass="WordCollectorViewController" customModule="App"', story, count=1)
    if count != 1:
        raise SystemExit("Cannot find Capacitor bridge view controller in Main.storyboard")
    storyboard.write_text(story, encoding="utf-8")
print("Configured iOS Keychain, UIDocumentPicker, and native bridge.")
