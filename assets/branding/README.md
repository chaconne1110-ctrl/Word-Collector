# Launcher artwork

`launcher-foreground.png` is the Word Collector mark on transparency, without
an enclosing tile, border, or drop shadow. The white document and drawer label
within the mark remain opaque.

Run `bash scripts/generate-launcher-icons.sh` with ImageMagick 7 to package it
for Android and the web. The script generates all five Android density sets,
opaque white square icons, legacy round icons, and the web maskable icon.

Android API 26+ uses `@mipmap/ic_launcher` / `ic_launcher_round` adaptive icons:
a full white background and a transparent foreground. The mark occupies 48dp
of the 108dp layer, about two thirds of the 72dp visible viewport. The system
applies the outside circle or rounded shape. Do not bake another tile into the
foreground.

The unused Android template vector artwork and all eleven Capacitor splash
PNGs were removed. The `splash` fallback now points to the existing Word
Collector launch screen. Rebuild the APK to update icons already installed on
Android; updating web assets alone cannot replace an installed APK icon.
