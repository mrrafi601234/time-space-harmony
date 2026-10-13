<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep favorite links in the shared LocalStorage namespace so existing backup, restore and reset actions include them.
- Keep weather scene selection in a pure browser-safe helper and photo rendering separate from the canvas, so weather mappings are testable and background modes remain independent.
- Bundle the weather photo set as local assets and preload each next image before crossfading, so background transitions never expose a missing image.
- Keep dashboard time tools deadline-based, with persisted transition state in the shared LocalStorage namespace and browser-safe pure timing helpers; this prevents background-tab tick drift and preserves running tools across navigation.
- Scope distance-viewing typography and contrast to the dashboard widgets so secondary pages and Quick Links retain their established hierarchy.
