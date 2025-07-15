# BibleLink Development Guide

This guide covers setting up the development environment for the BibleLink Obsidian plugin.

## Prerequisites

- Node.js 16+ 
- npm or yarn
- Git
- TypeScript knowledge
- Obsidian for testing

## Installation

### Standard Installation
```bash
git clone https://github.com/chibashr/obsidian-biblelink.git
cd obsidian-biblelink
npm install
```

## Development Workflow

### Building the Plugin

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build

# Clean build artifacts
npm run clean
```

### Testing in Obsidian

1. Build the plugin: `npm run build`
2. Copy files to your test vault:
   ```bash
   # Windows
   xcopy /E /Y . "path\to\your\vault\.obsidian\plugins\biblelink\"
   
   # macOS/Linux  
   cp -r . /path/to/your/vault/.obsidian/plugins/biblelink/
   ```
3. Enable the plugin in Obsidian settings
4. Test functionality

### Project Structure

```
obsidian-biblelink/
├── src/                    # TypeScript source files
│   ├── main.ts            # Main plugin class
│   ├── database.ts        # JSON database management
│   ├── selector.ts        # Bible reference selector modal
│   └── settings.ts        # Settings tab
├── .github/workflows/     # CI/CD configuration
├── manifest.json          # Plugin metadata
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── esbuild.config.mjs     # Build configuration
└── README.md              # User documentation
```

## Development Tips

### Database Development
- The JSON database is created automatically in `.biblelink/bible_data.json`
- Sample ASV verses are inserted on first run
- Test with different Bible translations by uploading XML files
- Data is stored in the vault for easy backup and sharing

### Modal Development  
- Use Obsidian's Modal API for consistent UI
- Test with different screen sizes
- Ensure proper error handling and validation

### Settings Development
- Follow Obsidian's settings conventions
- Provide clear descriptions and validation
- Test file upload functionality thoroughly

### Dataview Integration
- Test with and without Dataview plugin installed
- Verify virtual note creation works correctly
- Test various query patterns

## Debugging

### Enable Debug Mode
Add to your test vault's console:
```javascript
// Enable verbose logging
localStorage.setItem('obsidian-biblelink-debug', 'true');
```

### Common Issues

1. **Data Storage Errors**: Check file permissions in .biblelink/ directory
2. **Import Failures**: Verify XML file formats match expected schema
3. **Modal Not Opening**: Check for JavaScript errors in developer console
4. **Build Failures**: Ensure all dependencies are properly installed

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public methods
- Include error handling for all user-facing operations

### Testing
- Test on multiple operating systems if possible
- Verify with different Bible file formats
- Test Dataview integration scenarios
- Check performance with large Bible databases

### Pull Requests
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature X"`
5. Push to your fork: `git push origin feature/my-feature`
6. Create pull request with detailed description

## Release Process

### Version Management
1. Update version in `manifest.json` and `package.json`
2. Update changelog in README.md
3. Create git tag: `git tag v1.0.1`
4. Push tags: `git push --tags`

### Automated Releases
- GitHub Actions automatically builds and creates releases for version tags
- Release includes plugin files and documentation
- Community plugin store submission (manual process)

## Troubleshooting

### Build Environment Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify TypeScript installation: `tsc --version`

### Plugin Loading Issues
- Check Obsidian developer console for errors
- Verify manifest.json is valid JSON
- Ensure main.js is built correctly
- Check file permissions in plugin directory

### Data Storage Issues
- Verify .biblelink directory is created in vault
- Check JSON file permissions
- Test with sample data first
- Validate XML file schema for imports

## Support

- **Issues**: [GitHub Issues](https://github.com/chibashr/obsidian-biblelink/issues)
- **Discussions**: [GitHub Discussions](https://github.com/chibashr/obsidian-biblelink/discussions)
- **Obsidian Discord**: #plugin-dev channel for general plugin development help

---

*Happy coding! May your development be bug-free and your builds successful.* 