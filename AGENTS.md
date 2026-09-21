# OpenDigger Agent Instructions

## Labeled data

Use these rules when adding or updating entries under `labeled_data/`.

### Directory and label structure

- Mirror the existing hierarchy. A directory label uses `index.yml`; a child project normally uses `<project_key>.yml` in the parent directory.
- Use stable lowercase snake_case keys unless the surrounding directory already follows another established convention.
- Refer to a label in the same directory by its local key. Refer to a label elsewhere with its absolute identifier, for example `':companies/google/a2aproject'`.
- Keep one canonical project label. If a project has multiple initiating companies, store its GitHub entities in one project file and let the other company labels reference that canonical label. Do not duplicate the same project IDs in multiple project files.
- Add a new sub-foundation to its parent foundation's `data.labels`. For Linux Foundation sub-foundations, update `labeled_data/foundations/linux_foundation/index.yml`.

### Required content

- Use a supported `type`, normally `Foundation`, `Company`, or `Project` for this workflow.
- Add concise English and Chinese metadata when it is known:
  - `name`
  - `name_zh` when a commonly used Chinese name exists
  - `description`
  - `description_zh`
- Company descriptions must be neutral descriptions of the company. Do not mention projects the company initiated, donated, maintains, or sponsors in the company description.
- Put project origin, contribution, or founding relationships in the project description instead.
- Describe foundations by their purpose and governance scope, not by enumerating all projects in prose.
- If a translation, company attribution, headquarters location, or project relationship is uncertain, do not guess. Leave it for manual review and report the unresolved item.

### Entity attribution and IDs

- Verify project membership and origin using current authoritative sources such as the foundation project page, an official announcement, the project's official site, or its official repository.
- Prefer primary sources. Record only relationships supported by those sources.
- Resolve GitHub numeric IDs from the GitHub API rather than copying names alone.
- Use `orgs` for GitHub organizations and `repos` for individual repositories. Store both the numeric `id` and current canonical `name`.
- Follow repository redirects and use the current canonical `owner/repository` name while retaining the repository's stable numeric ID.
- Prefer an organization ID when the label intentionally represents the whole organization; otherwise list only the project repositories in scope.

### Companies and geographic divisions

- Put projects under their initiating company label when the relationship is verified.
- Add newly created company labels to the appropriate country subdivision label under `labeled_data/divisions/` when an authoritative headquarters or principal-office location is available.
- Use the existing absolute company-label form, for example `':companies/example'`.
- Do not infer a subdivision from incorporation jurisdiction, contributor locations, or a vague country-only profile.

### Validation

- Preserve unrelated user changes in the worktree.
- Run `git diff --check` after editing YAML.
- Run the label parser tests:

  ```bash
  ./node_modules/.bin/mocha -r ts-node/register test/label.test.ts
  ```

- For a new aggregate foundation label, also verify programmatically that all expected child organization and repository IDs appear in the aggregate and that all referenced labels resolve.

## Logos

Use these rules for label artwork under `local_files/logos_origin/` and `local_files/logos/`.

### Paths and source files

- Mirror the label identifier exactly beneath `local_files/logos_origin/`, omitting the leading colon and using a `.png` extension. Examples:
  - `:foundations/linux_foundation/aaif` -> `local_files/logos_origin/foundations/linux_foundation/aaif.png`
  - `:companies/block/goose` -> `local_files/logos_origin/companies/block/goose.png`
- The processed output must use the identical relative path beneath `local_files/logos/`.
- Keep the best available original image in `logos_origin`. Do not resize it before storing it there.
- Prefer sources in this order:
  1. An official downloadable brand or media kit.
  2. The foundation's official project page.
  3. The project's or company's official website or source repository.
  4. The verified official GitHub organization avatar.
- Prefer a high-resolution, square PNG with a real transparent channel. If no suitable transparent asset exists, keep the official opaque image rather than inventing transparency or removing its background.
- Prefer a standalone symbol suitable for a square avatar over a wide wordmark.
- Do not generate, redraw, recolor, crop, or otherwise alter an official logo unless the user explicitly requests it.
- Do not overwrite an existing original logo merely because another source is available; first confirm that the replacement is more authoritative or materially better.

### Processing and checks

- Process logos from the repository root with:

  ```bash
  node lib/local/process_logos.js
  ```

- The processor walks all of `logos_origin`, preserves relative paths, and writes 240 x 240 RGBA PNGs to `local_files/logos/` using contain-fit centering on a transparent canvas.
- After processing, verify:
  - every source image has a corresponding `.png` output;
  - every newly added label has both its original and processed logo;
  - new outputs are 240 x 240 PNG files;
  - a visual contact sheet or direct inspection shows no clipping, distortion, blank image, or unreadable mark.
- `local_files` may be excluded through `.git/info/exclude`, so the absence of these files from `git status` does not mean they were not created. Check them directly on disk.

### Uploading

- Uploading is an external write. Run it only when the user explicitly requests or authorizes publishing the logos.
- The repository script is named `local_files/upload_open_digger_logos.sh` (plural `logos`). Run it from the repository root:

  ```bash
  bash local_files/upload_open_digger_logos.sh
  ```

- The script synchronizes the entire processed `local_files/logos` tree to three configured OSS destinations; it is not limited to newly added files. Tell the user this before or after running it.
- Confirm that all three sync commands finish successfully. Then perform read-only spot checks with `ossutilmac64 ls` against each destination for representative new objects.
- Never expose OSS credentials or configuration-file contents in output.
