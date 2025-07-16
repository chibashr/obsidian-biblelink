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
   xcopy /E /Y . "path\to\your\vault\.obsidian\plugins\obsidian-biblelink\"
   
   # macOS/Linux  
   cp -r . /path/to/your/vault/.obsidian/plugins/obsidian-biblelink/
   ```
3. Enable the plugin in Obsidian settings
4. Test functionality

### Project Structure

```
obsidian-biblelink/
├── src/                    # TypeScript source files
│   ├── main.ts            # Main plugin class and command registration
│   ├── database.ts        # JSON database management and data operations
│   ├── selector.ts        # Bible reference selector modal with grid interface
│   └── settings.ts        # Settings tab and translation management
├── data/                  # Data files
│   ├── sample_bible_data.json  # Sample Bible data structure
│   └── settings.json      # Default settings
├── .github/workflows/     # CI/CD configuration
├── manifest.json          # Plugin metadata
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── esbuild.config.mjs     # Build configuration
└── README.md              # User documentation
```

## Core Features Implementation

### Main Plugin Class (`main.ts`)
- **Command Registration**: "Insert Bible Reference" command
- **Code Block Processor**: Custom markdown processor for Bible verses
- **Shortcut System**: Keyboard shortcut registration and processing
- **Dataview Integration**: Virtual note creation for query support
- **Settings Management**: Custom settings persistence system
- **CSS Styling**: Dynamic style injection for code blocks

### Database Management (`database.ts`)
- **JSON Storage**: Local Bible data storage in JSON format
- **Translation Management**: Add, update, remove translations
- **Verse Operations**: Add verses individually or in batches
- **Import Support**: SQLite and XML file imports
- **Processing Rules**: Custom text formatting rules
- **Data Validation**: Reference validation and error handling

### Modal Interface (`selector.ts`)
- **Grid-Based Selection**: Modern grid interface for books/chapters/verses
- **Reference Parsing**: Complex reference parsing with validation
- **Multi-Selection**: Support for verse ranges and multiple selections
- **Modal Persistence**: Remembers user preferences
- **Real-time Preview**: Live preview of selected references

### Settings Management (`settings.ts`)
- **Comprehensive Settings**: All plugin configuration options
- **Translation Management**: Download, upload, edit translations
- **Shortcut Configuration**: Add, edit, remove keyboard shortcuts
- **Code Block Styling**: Color and style customization
- **Modal Configuration**: Persistent modal settings

## Development Tips

### Database Development
- The JSON database is created automatically in `data/bible_data.json`
- Sample ASV verses are inserted on first run
- Test with different Bible translations by uploading XML files
- Data is stored in the plugin directory for easy backup and sharing
- Use `getDatabaseStats()` to monitor data integrity

### Modal Development  
- Use Obsidian's Modal API for consistent UI
- Test with different screen sizes and responsive design
- Ensure proper error handling and validation
- Implement grid-based selection for better UX
- Add real-time preview functionality

### Settings Development
- Follow Obsidian's settings conventions
- Provide clear descriptions and validation
- Test file upload functionality thoroughly
- Implement persistent modal settings
- Add comprehensive translation management

### Code Block Processing
- Register custom markdown processor with options
- Support multiple output formats (text, link, codeblock)
- Implement customizable styling options
- Handle complex reference parsing
- Add red-letter text detection

### Shortcut System
- Register keyboard shortcuts dynamically
- Support custom shortcut configuration
- Implement reference parsing for shortcuts
- Add validation and error handling
- Test with various reference formats

### Dataview Integration
- Test with and without Dataview plugin installed
- Verify virtual note creation works correctly
- Test various query patterns and metadata
- Ensure proper file path handling
- Add comprehensive metadata fields

## Debugging

### Enable Debug Mode
Add to your test vault's console:
```javascript
// Enable verbose logging
localStorage.setItem('obsidian-biblelink-debug', 'true');
```

### Console Logging
The plugin includes comprehensive logging:
```typescript
console.log('[BibleLink] [functionName] Message');
console.error('[BibleLink] [functionName] Error:', error);
```

### Common Issues

1. **Data Storage Errors**: Check file permissions in data/ directory
2. **Import Failures**: Verify XML file formats match expected schema
3. **Modal Not Opening**: Check for JavaScript errors in developer console
4. **Build Failures**: Ensure all dependencies are properly installed
5. **Code Block Not Rendering**: Check markdown processor registration
6. **Shortcuts Not Working**: Verify shortcut registration and parsing

### Testing Checklist
- [ ] Plugin loads without errors
- [ ] Database initializes correctly
- [ ] Modal opens and functions properly
- [ ] Code blocks render with styling
- [ ] Shortcuts work as expected
- [ ] Settings persist correctly
- [ ] Translation imports work
- [ ] Dataview integration functions
- [ ] Error handling works properly

## Code Style Guidelines

### TypeScript
- Use strict mode configuration
- Define proper interfaces for all data structures
- Use async/await for all asynchronous operations
- Implement proper error handling with try/catch
- Add JSDoc comments for public methods

### Naming Conventions
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPER_CASE for constants
- Use descriptive names that explain purpose

### Error Handling
- Always wrap file operations in try/catch
- Provide user-friendly error messages
- Log errors for debugging
- Gracefully handle missing data

### Performance
- Use efficient data structures
- Minimize file I/O operations
- Implement proper cleanup in onunload
- Cache frequently accessed data

## Contributing

### Code Style
- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for public methods
- Include error handling for all user-facing operations
- Test thoroughly before submitting

### Testing
- Test on multiple operating systems if possible
- Verify with different Bible file formats
- Test Dataview integration scenarios
- Check performance with large Bible databases
- Test all output formats and styling options

### Pull Requests
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make changes and test thoroughly
4. Commit with clear messages: `git commit -m "Add feature X"`
5. Push to your fork: `git push origin feature/my-feature`
6. Create pull request with detailed description

### Feature Development
- Follow the existing architecture patterns
- Add proper error handling
- Include comprehensive logging
- Update documentation
- Add tests if applicable

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

### Pre-release Testing
- [ ] Build succeeds without errors
- [ ] All features work correctly
- [ ] Settings persist properly
- [ ] No console errors
- [ ] Documentation is up to date

## Troubleshooting

### Build Environment Issues
- Clear npm cache: `npm cache clean --force`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify TypeScript installation: `tsc --version`
- Check esbuild configuration

### Plugin Loading Issues
- Check Obsidian developer console for errors
- Verify manifest.json is valid JSON
- Ensure main.js is built correctly
- Check file permissions in plugin directory
- Verify all dependencies are included

### Data Storage Issues
- Verify data directory is created in plugin folder
- Check JSON file permissions
- Test with sample data first
- Validate XML file schema for imports
- Check for file corruption

### Runtime Issues
- Monitor console for error messages
- Check database initialization
- Verify translation loading
- Test modal functionality
- Check code block processing

## Support

- **Issues**: [GitHub Issues](https://github.com/chibashr/obsidian-biblelink/issues)
- **Discussions**: [GitHub Discussions](https://github.com/chibashr/obsidian-biblelink/discussions)
- **Obsidian Discord**: #plugin-dev channel for general plugin development help

## Development Philosophy

This plugin follows the **"Vibe Coding"** approach:
- **Positive Energy**: Writing code with good vibes and positive intentions
- **Flow State**: Maintaining a smooth, enjoyable development experience
- **User-Centric Design**: Focusing on creating delightful user experiences
- **Simplicity**: Keeping things simple and intuitive
- **Community**: Building with the community in mind

---

*Happy coding! May your development be bug-free and your builds successful.* ✨ 

## Release Build and Packaging Process

1. Ensure the version in manifest.json is updated and matches the intended release tag.
2. Run your build command to generate main.js (e.g., using esbuild or your chosen bundler).
3. Create a .zip file named obsidian-biblelink.zip containing only main.js and manifest.json (and styles.css if present).
   - On Windows, you can use:
     - Select main.js and manifest.json
     - Right-click > Send to > Compressed (zipped) folder
     - Rename the zip to obsidian-biblelink.zip
   - Or use PowerShell:
     - Compress-Archive -Path main.js,manifest.json -DestinationPath obsidian-biblelink.zip -Force
4. Attach the .zip file to your GitHub release.
5. Add release notes/changelog and publish the release. 