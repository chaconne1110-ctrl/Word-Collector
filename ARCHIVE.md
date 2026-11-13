# Archive: Flutter version of Word Collector (2026-11-10)

Source of the Flutter app (`WordCollector_Review_ui-ux` on the owner's Desktop), saved on 2026-11-14 because its Git history was lost (the folder was a worktree of a repository that has since been deleted) and none of these files existed on GitHub.

- Not used by the current app. The live app is the Capacitor/web app on `V11.13` (and later `Vmm.dd` branches).
- Last state matches the former `feature/flutter-gemini35` work: Flutter review screen, local word database, Gemini analysis service, tests, and a local Node analysis server.
- Excluded on purpose: `server/.env` (contained a Gemini API key entry), `android/local.properties` (machine paths), build output, `.dart_tool`, IDE and generated *ephemeral* files.
- To use: install Flutter, then `flutter pub get`, create `server/.env` from `server/.env.example` if the local server is needed.
