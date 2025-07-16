# Obsidian Plugin GitHub Release Checklist

## 1. Versioning
- [ ] Use semantic versioning (e.g., v1.2.3) for your release tag.
- [ ] Ensure the version field in manifest.json matches the release tag.

## 2. Release Artifacts
- [ ] Create a .zip file named after your plugin (e.g., obsidian-biblelink.zip).
- [ ] The .zip file contains:
  - [ ] main.js (compiled JavaScript)
  - [ ] manifest.json
  - [ ] styles.css (if your plugin uses custom styles)

## 3. Release Notes
- [ ] Write clear release notes/changelog describing new features, fixes, and changes.

## 4. Manifest Consistency
- [ ] id in manifest.json is unique and consistent.
- [ ] version in manifest.json matches the release tag.
- [ ] All required fields in manifest.json are present and correct.

## 5. GitHub Release Process
- [ ] Go to the "Releases" section of your GitHub repository.
- [ ] Click "Draft a new release".
- [ ] Set the tag version (e.g., v1.2.3).
- [ ] Attach your plugin .zip file.
- [ ] Add release notes/changelog.
- [ ] Publish the release.

## 6. (Optional) Community Plugins Directory
- [ ] If submitting to the Obsidian Community Plugins directory:
  - [ ] Submit a pull request to the obsidianmd/obsidian-releases repo.
  - [ ] Follow the plugin submission guidelines. 