import { App, PluginSettingTab, Setting, Notice, requestUrl, Modal } from 'obsidian';
import { parseStringPromise } from 'xml2js';
import BibleLinkPlugin from './main';
import { ProcessingRule } from './database';

export interface BibleLinkSettings {
    defaultTranslation: string;
    outputType: 'text' | 'link' | 'codeblock';
    // Display options
    showTranslationAbbr: boolean;
    showBookAbbr: boolean;
    // Shortcuts
    enableShortcuts: boolean;
    shortcuts: Record<string, string>;
    // Dataview integration
    enableDataviewMetadata: boolean;
    dataviewMetadataFields: string[];
    // Code block styling
    codeBlockBackgroundColor: string;
    codeBlockHeadingStyle: 'none' | 'simple' | 'detailed';
    codeBlockTextColor: string;
    codeBlockVerseNumberColor: string;
    codeBlockLanguage: string;
    // Modal persistence
    modalOutputType: 'text' | 'link' | 'codeblock';
    modalOptions: string[];
}

export const DEFAULT_SETTINGS: BibleLinkSettings = {
    defaultTranslation: 'ASV',
    outputType: 'codeblock',
    showTranslationAbbr: true,
    showBookAbbr: false,
    enableShortcuts: true,
    shortcuts: {
        'jn316': 'John 3:16',
        'gen11': 'Genesis 1:1',
        'ps231': 'Psalm 23:1',
        'rom828': 'Romans 8:28',
        'jn11': 'John 1:1'
    },
    enableDataviewMetadata: true,
    dataviewMetadataFields: ['book', 'chapter', 'verse', 'translation', 'text', 'reference', 'language', 'category'],
    codeBlockBackgroundColor: '#f8f9fa',
    codeBlockHeadingStyle: 'detailed',
    codeBlockTextColor: '#2c3e50',
    codeBlockVerseNumberColor: '#7f8c8d',
    codeBlockLanguage: 'bible',
    modalOutputType: 'codeblock',
    modalOptions: []
};

// Bible translations available from scrollmapper/bible_databases
const AVAILABLE_TRANSLATIONS = {
    'ASV': { name: 'American Standard Version (1901)', language: 'en', category: 'English' },
    'KJV': { name: 'King James Version', language: 'en', category: 'English' },
    'WEB': { name: 'World English Bible', language: 'en', category: 'English' },
    'YLT': { name: 'Young\'s Literal Translation (1898)', language: 'en', category: 'English' },
    'BBE': { name: 'Bible in Basic English (1949/1964)', language: 'en', category: 'English' },
    'AKJV': { name: 'American King James Version', language: 'en', category: 'English' },
    'Webster': { name: 'Webster Bible', language: 'en', category: 'English' },
    'Tyndale': { name: 'William Tyndale Bible (1525/1530)', language: 'en', category: 'Historical' },
    'Wycliffe': { name: 'John Wycliffe Bible (c.1395)', language: 'enm', category: 'Historical' },
    'BSB': { name: 'Berean Standard Bible', language: 'en', category: 'English' },
    'CPDV': { name: 'Catholic Public Domain Version', language: 'en', category: 'English' },
    'UKJV': { name: 'Updated King James Version', language: 'en', category: 'English' },
    'Twenty': { name: 'Twentieth Century New Testament', language: 'en', category: 'English' },
    'Anderson': { name: 'Henry Tompkins Anderson\'s 1864 New Testament', language: 'en', category: 'Historical' },
    'ACV': { name: 'A Conservative Version', language: 'en', category: 'English' },
    'SpaRV': { name: 'La Santa Biblia Reina-Valera (1909)', language: 'es', category: 'Spanish' },
    'SpaRV1865': { name: 'La Santa Biblia Reina-Valera (1865)', language: 'es', category: 'Spanish' },
    'SpaRVG': { name: 'Reina Valera Gómez', language: 'es', category: 'Spanish' },
    'SpaPlatense': { name: 'Biblia Platense (Straubinger)', language: 'es', category: 'Spanish' },
    'Vulgate': { name: 'Latin Vulgate', language: 'la', category: 'Latin' },
    'VulgClementine': { name: 'Clementine Vulgate', language: 'la', category: 'Latin' },
    'Byz': { name: 'The New Testament in the Original Greek: Byzantine Textform 2013', language: 'grc', category: 'Greek' },
    'TR': { name: 'Textus Receptus (1550/1894)', language: 'grc', category: 'Greek' },
    'WLC': { name: 'Westminster Leningrad Codex', language: 'hbo', category: 'Hebrew' },
    'StatResGNT': { name: 'Statistical Restoration Greek New Testament', language: 'grc', category: 'Greek' },
    'VulgSistine': { name: 'Vulgata Sistina', language: 'la', category: 'Latin' },
    'VulgHetzenauer': { name: 'Vulgata Clementina, Hetzenauer editore', language: 'la', category: 'Latin' },
    'VulgConte': { name: 'Vulgata Clementina, Conte editore', language: 'la', category: 'Latin' },
    'Swe1917': { name: 'Swedish Bible (1917)', language: 'sv', category: 'Swedish' },
    'SweKarlXII': { name: 'Svenska Karl XII:s Bibel (1703)', language: 'sv', category: 'Historical' },
    'SweKarlXII1873': { name: 'Svenska Karl XII:s Bibel (1873)', language: 'sv', category: 'Historical' },
    'UkrOgienko': { name: 'Українська Біблія. Переклад Івана Огієнка.', language: 'uk', category: 'Ukrainian' },
    'Viet': { name: 'Kinh Thánh Tiếng Việt (1934)', language: 'vi', category: 'Vietnamese' },
    'ThaiKJV': { name: 'Thai King James Version', language: 'th', category: 'Thai' },
    'TagAngBiblia': { name: 'Philippine Bible Society (1905)', language: 'tl', category: 'Tagalog' },
    'Tausug': { name: 'Tausug Kitab Injil', language: 'tsg', category: 'Tausug' },
    'TpiKJPB': { name: 'King Jems Pisin Baibel', language: 'tpi', category: 'Tok Pisin' },
    'BurJudson': { name: '1835 Judson Burmese Bible', language: 'my', category: 'Burmese' },
    'Alb': { name: 'Albanian Bible', language: 'sq', category: 'Albanian' },
    'ArmEastern': { name: 'Eastern Armenian Bible', language: 'hy', category: 'Armenian' },
    'BeaMRK': { name: 'The Gospel of Mark in Beaver (Danezaa)', language: 'bea', category: 'Indigenous' },
    'SrKDEkavski': { name: 'Serbian Bible Daničić-Karadžić Ekavski', language: 'sr', category: 'Serbian' },
    'SrKDIjekav': { name: 'Serbian Bible Daničić-Karadžić Ijekavski', language: 'sr', category: 'Serbian' },
    'Wulfila': { name: 'Bishop Wulfila Gothic Bible', language: 'got', category: 'Gothic' },
    'sml_BL_2008': { name: 'Kitab Awal-Jaman maka Kitab Injil', language: 'sml', category: 'Indigenous' },
    'vlsJoNT': { name: 'Het Nieuwe Testament by Nicolaas De Jonge', language: 'vls', category: 'Dutch' }
};

export class BibleLinkSettingTab extends PluginSettingTab {
    plugin: BibleLinkPlugin;
    private filterText: string = '';
    private editingAbbr: string | null = null;
    private editingName: string = '';

    constructor(app: App, plugin: BibleLinkPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        containerEl.createEl('h2', { text: 'BibleLink Settings' });

        // Basic Settings Section
        containerEl.createEl('h3', { text: 'Basic Settings' });

        // Default Translation Setting
        new Setting(containerEl)
            .setName('Default Translation')
            .setDesc('Choose your preferred Bible translation.')
            .addDropdown(dropdown => {
                const translations = this.plugin.db.getTranslations();
                const translationOptions: Record<string, string> = {};

                translations.forEach(trans => {
                    translationOptions[trans.abbreviation] = `${trans.name} (${trans.abbreviation})`;
                });

                dropdown
                    .addOptions(translationOptions)
                    .setValue(this.plugin.settings.defaultTranslation)
                    .onChange(async (value) => {
                        this.plugin.settings.defaultTranslation = value;
                        await this.plugin.saveSettings();
                    });
            });

        // Default Output Type Setting
        new Setting(containerEl)
            .setName('Default Output Type')
            .setDesc('Choose how references are inserted.')
            .addDropdown(dropdown => dropdown
                .addOption('text', 'Full Verse Text')
                .addOption('link', 'Literal Word Link')
                .addOption('codeblock', 'Code Block')
                .setValue(this.plugin.settings.outputType)
                .onChange(async (value) => {
                    this.plugin.settings.outputType = value as 'text' | 'link' | 'codeblock';
                    await this.plugin.saveSettings();
                }));

        // Display Options
        new Setting(containerEl)
            .setName('Show Translation Abbreviation')
            .setDesc('Include translation abbreviation in the output.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showTranslationAbbr)
                .onChange(async (value) => {
                    this.plugin.settings.showTranslationAbbr = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Show Book Abbreviations')
            .setDesc('Use abbreviated book names (e.g., Jn instead of John).')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.showBookAbbr)
                .onChange(async (value) => {
                    this.plugin.settings.showBookAbbr = value;
                    await this.plugin.saveSettings();
                }));

        // Code Block Styling Section
        containerEl.createEl('h3', { text: 'Code Block Styling' });

        // Code Block Background Color
        new Setting(containerEl)
            .setName('Background Color')
            .setDesc('Background color for Bible verse code blocks.')
            .addColorPicker(colorPicker => colorPicker
                .setValue(this.plugin.settings.codeBlockBackgroundColor)
                .onChange(async (value) => {
                    this.plugin.settings.codeBlockBackgroundColor = value;
                    await this.plugin.saveSettings();
                }));

        // Code Block Heading Style
        new Setting(containerEl)
            .setName('Heading Style')
            .setDesc('Style for the reference heading in code blocks.')
            .addDropdown(dropdown => dropdown
                .addOption('none', 'No Heading')
                .addOption('simple', 'Simple (John 3:16)')
                .addOption('detailed', 'Detailed (John 3:16 ASV)')
                .setValue(this.plugin.settings.codeBlockHeadingStyle)
                .onChange(async (value) => {
                    this.plugin.settings.codeBlockHeadingStyle = value as 'none' | 'simple' | 'detailed';
                    await this.plugin.saveSettings();
                }));

        // Code Block Text Color
        new Setting(containerEl)
            .setName('Text Color')
            .setDesc('Color for the verse text in code blocks.')
            .addColorPicker(colorPicker => colorPicker
                .setValue(this.plugin.settings.codeBlockTextColor)
                .onChange(async (value) => {
                    this.plugin.settings.codeBlockTextColor = value;
                    await this.plugin.saveSettings();
                }));

        // Code Block Verse Number Color
        new Setting(containerEl)
            .setName('Verse Number Color')
            .setDesc('Color for verse numbers in code blocks.')
            .addColorPicker(colorPicker => colorPicker
                .setValue(this.plugin.settings.codeBlockVerseNumberColor)
                .onChange(async (value) => {
                    this.plugin.settings.codeBlockVerseNumberColor = value;
                    await this.plugin.saveSettings();
                }));

        // Code Block Language
        new Setting(containerEl)
            .setName('Code Block Language')
            .setDesc('The language identifier for Bible verse code blocks.')
            .addText(text => text
                .setPlaceholder('bible')
                .setValue(this.plugin.settings.codeBlockLanguage)
                .onChange(async (value) => {
                    this.plugin.settings.codeBlockLanguage = value;
                    await this.plugin.saveSettings();
                }));

        // Example Code Block
        const exampleContainer = containerEl.createDiv();
        exampleContainer.createEl('h4', { text: 'Code Block Examples' });
        exampleContainer.createEl('p', {
            text: 'Use options in square brackets after the language identifier to customize the output:'
        });
        
        // Add explanation of syntax
        const syntaxExample = exampleContainer.createDiv({ cls: 'biblelink-syntax-example' });
        syntaxExample.createEl('p', { 
            text: 'Syntax: ```bible [option1,option2,option3]',
            cls: 'biblelink-syntax-text'
        });
        
        const examples = [
            {
                label: 'Basic verse (no options):',
                code: `\`\`\`${this.plugin.settings.codeBlockLanguage}\nNASB 1 John 3:17\n\`\`\``
            },
            {
                label: 'With link option (shows a link to the verse):',
                code: `\`\`\`${this.plugin.settings.codeBlockLanguage}\nNASB Matthew 8:8-40 [link]\n\`\`\``
            },
            {
                label: 'With verse option (displays numbers per verse):',
                code: `\`\`\`${this.plugin.settings.codeBlockLanguage}\nNASB 1 Corinthians 1:2-3 [verse]\n\`\`\``
            },
            {
                label: 'With chapter option (displays each chapter as Chapter X):',
                code: `\`\`\`${this.plugin.settings.codeBlockLanguage}\nNASB Psalm 23 [chapter]\n\`\`\``
            },
            {
                label: 'Multiple options (comma-separated):',
                code: `\`\`\`${this.plugin.settings.codeBlockLanguage}\nNASB John 3:16-18 [verse,chapter,link]\n\`\`\``
            }
        ];
        
        for (const ex of examples) {
            const exampleDiv = exampleContainer.createDiv({ cls: 'biblelink-example-item' });
            exampleDiv.createEl('div', { text: ex.label, cls: 'biblelink-example-label' });
            const codeBlock = exampleDiv.createEl('pre', { cls: 'biblelink-example-code' });
            codeBlock.createEl('code', { text: ex.code });
        }

        // Shortcuts Section
        containerEl.createEl('h3', { text: 'Bible Reference Shortcuts' });
        this.renderShortcutsSection(containerEl);

        // Dataview Integration Section
        containerEl.createEl('h3', { text: 'Dataview Integration' });

        new Setting(containerEl)
            .setName('Enable Dataview Metadata')
            .setDesc('Add rich metadata to Bible verses for Dataview queries.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.enableDataviewMetadata)
                .onChange(async (value) => {
                    this.plugin.settings.enableDataviewMetadata = value;
                    await this.plugin.saveSettings();
                }));

        if (this.plugin.settings.enableDataviewMetadata) {
            const metadataContainer = containerEl.createDiv();
            metadataContainer.createEl('p', {
                text: 'Available metadata fields: book, chapter, verse, translation, text, reference, language, category'
            });

            // Show Dataview query explanation
            const queryContainer = metadataContainer.createDiv();
            queryContainer.createEl('h4', { text: 'How to Query Bible Verses' });
            queryContainer.createEl('p', {
                text: 'Use Dataview queries to search and display Bible verses. You can filter by translation, book, chapter, verse, or search within the text content.'
            });

            const exampleQuery = `\`\`\`dataview
TABLE book, chapter, verse, translation
FROM "Bible"
WHERE translation = "ASV"
SORT book, chapter, verse
\`\`\``;
            const codeBlock = queryContainer.createEl('pre');
            codeBlock.createEl('code', { text: exampleQuery });
        }

        // Translation Management Section
        containerEl.createEl('h3', { text: 'Translation Management' });

        // Upload Custom Translation Section
        const uploadSection = containerEl.createDiv({ cls: 'biblelink-upload-section' });
        uploadSection.createEl('h4', { text: 'Upload Custom Translation' });
        
        const uploadDesc = uploadSection.createEl('p');
        uploadDesc.innerHTML = 'Upload your own Bible translation files. <strong>XML format is recommended</strong> and can be downloaded from <a href="https://github.com/scrollmapper/bible_databases" target="_blank">scrollmapper/bible_databases</a>.';

        new Setting(uploadSection)
            .setName('Upload Translation')
            .setDesc('Choose a file to upload (SQLite or XML format).')
            .addButton(button => button
                .setButtonText('Upload XML')
                .setClass('mod-cta')
                .onClick(() => this.uploadXMLFile()))
            .addButton(button => button
                .setButtonText('Upload SQLite')
                .onClick(() => this.uploadSQLiteFile()));

        // Current Translations Table
        this.displayCurrentTranslations(containerEl);

        // Import Status Section
        // this.displayImportStatus(containerEl); // Removed as per edit hint
    }

    private displayCurrentTranslations(containerEl: HTMLElement) {
        // Section header
        const sectionHeader = containerEl.createDiv({ cls: 'biblelink-translations-header' });
        sectionHeader.createEl('h4', { text: 'Installed Translations' });

        // Filter input
        const filterContainer = containerEl.createDiv({ cls: 'biblelink-filter-container' });
        const filterInput = filterContainer.createEl('input', {
            type: 'text',
            placeholder: 'Search translations...',
            cls: 'biblelink-filter-input'
        });

        // Create table container
        const tableContainer = containerEl.createDiv({ cls: 'biblelink-table-container' });

        // Sort state
        let sortField: 'name' | 'abbreviation' | 'language' | 'category' = 'name';
        let sortAsc = true;

        const renderTable = () => {
            tableContainer.empty();
            const table = tableContainer.createEl('table', { cls: 'biblelink-translation-table' });
            const thead = table.createEl('thead');
            const headerRow = thead.createEl('tr');

            // Create headers with sort functionality
            const createSortableHeader = (text: string, field: typeof sortField) => {
                const th = headerRow.createEl('th');
                th.createSpan({ text });
                if (sortField === field) {
                    th.createSpan({ text: sortAsc ? ' ↓' : ' ↑' });
                }
                th.onclick = () => {
                    if (sortField === field) {
                        sortAsc = !sortAsc;
                    } else {
                        sortField = field;
                        sortAsc = true;
                    }
                    renderTable();
                };
            };

            createSortableHeader('Translation Name', 'name');
            createSortableHeader('Abbreviation', 'abbreviation');
            createSortableHeader('Language', 'language');
            createSortableHeader('Category', 'category');
            headerRow.createEl('th', { text: 'Actions' });

            const tbody = table.createEl('tbody');

            // Get and filter translations
            let translations = this.plugin.db.getTranslations()
                .map(t => ({
                    ...t,
                    ...AVAILABLE_TRANSLATIONS[t.abbreviation],
                    installed: true
                }));

            // Apply filter
            const filterText = filterInput.value.toLowerCase();
            if (filterText) {
                translations = translations.filter(t =>
                    t.name.toLowerCase().includes(filterText) ||
                    t.abbreviation.toLowerCase().includes(filterText) ||
                    t.language?.toLowerCase().includes(filterText) ||
                    t.category?.toLowerCase().includes(filterText)
                );
            }

            // Apply sort
            translations.sort((a, b) => {
                const aVal = a[sortField] || '';
                const bVal = b[sortField] || '';
                return (sortAsc ? 1 : -1) * aVal.localeCompare(bVal);
            });

            if (translations.length === 0) {
                const emptyRow = tbody.createEl('tr');
                emptyRow.createEl('td', {
                    text: 'No translations installed.',
                    attr: { colspan: '5' }
                });
                return;
            }

            translations.forEach(trans => {
                const row = tbody.createEl('tr');

                if (this.editingAbbr === trans.abbreviation) {
                    // Edit mode
                    const nameCell = row.createEl('td');
                    const nameInput = nameCell.createEl('input', {
                        type: 'text',
                        value: trans.name,
                        cls: 'biblelink-edit-input',
                        placeholder: 'Translation Name'
                    });

                    const abbrCell = row.createEl('td');
                    const abbrInput = abbrCell.createEl('input', {
                        type: 'text',
                        value: trans.abbreviation,
                        cls: 'biblelink-edit-input',
                        placeholder: 'Abbreviation (e.g., KJV)'
                    });

                    row.createEl('td', { text: trans.language || '' });
                    row.createEl('td', { text: trans.category || '' });

                    const actionCell = row.createEl('td', { cls: 'biblelink-translation-actions' });
                    actionCell.createEl('button', { text: 'Save', cls: 'mod-cta' }).onclick = async () => {
                        const newName = nameInput.value.trim();
                        const newAbbr = abbrInput.value.trim().toUpperCase();

                        if (!newName || !newAbbr) {
                            new Notice('Name and abbreviation are required');
                            return;
                        }

                        // Check if new abbreviation already exists (except for current translation)
                        if (newAbbr !== trans.abbreviation && 
                            this.plugin.db.getTranslations().some(t => t.abbreviation === newAbbr)) {
                            new Notice('Abbreviation already exists');
                            return;
                        }

                        // Update translation
                        const oldAbbr = trans.abbreviation;
                        trans.name = newName;
                        trans.abbreviation = newAbbr;

                        // If this was the default translation, update the setting
                        if (this.plugin.settings.defaultTranslation === oldAbbr) {
                            this.plugin.settings.defaultTranslation = newAbbr;
                            await this.plugin.saveSettings();
                        }

                        await this.plugin.db.saveData?.();
                        this.editingAbbr = null;
                        renderTable();
                        new Notice('Translation updated');
                    };

                    actionCell.createEl('button', { text: 'Cancel' }).onclick = () => {
                        this.editingAbbr = null;
                        renderTable();
                    };
                } else {
                    // View mode
                    row.createEl('td', { text: trans.name });
                    row.createEl('td', { text: trans.abbreviation });
                    row.createEl('td', { text: trans.language || '' });
                    row.createEl('td', { text: trans.category || '' });

                    const actionCell = row.createEl('td', { cls: 'biblelink-translation-actions' });

                    if (trans.abbreviation !== 'ASV') {
                        actionCell.createEl('button', { text: 'Edit' }).onclick = () => {
                            // Open edit modal with current translation data
                            const translation = this.plugin.db.getTranslations().find(t => t.abbreviation === trans.abbreviation);
                            if (translation) {
                                new TranslationEditModal(
                                    this.app,
                                    translation.name,
                                    translation.abbreviation,
                                    translation.language,
                                    translation.category,
                                    translation.processingRules,
                                    async (name, abbreviation, language, category, processingRules) => {
                                        try {
                                            await this.plugin.db.updateTranslation(
                                                translation.id,
                                                name,
                                                abbreviation,
                                                language,
                                                category,
                                                processingRules
                                            );
                                            new Notice('Translation updated successfully');
                                            renderTable();
                                        } catch (error) {
                                            new Notice(`Error updating translation: ${error.message}`);
                                        }
                                    },
                                    true
                                ).open();
                            }
                        };
                        actionCell.createEl('button', {
                            text: 'Remove',
                            cls: 'mod-warning'
                        }).onclick = () => {
                            this.confirmRemoveTranslation(trans.abbreviation, trans.name);
                        };
                    } else {
                        actionCell.createEl('span', {
                            text: '(Built-in)',
                            cls: 'biblelink-builtin-label'
                        });
                    }
                }
            });
        };

        // Add filter listener
        filterInput.addEventListener('input', renderTable);

        // Initial render
        renderTable();

        // Add modern table CSS
        const css = `
            .biblelink-translations-header {
                margin-bottom: 16px;
            }
            .biblelink-filter-container {
                margin-bottom: 16px;
            }
            .biblelink-filter-input {
                width: 100%;
                max-width: 300px;
                padding: 8px 12px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
            }
            .biblelink-filter-input:focus {
                outline: none;
                border-color: var(--interactive-accent);
                box-shadow: 0 0 0 2px var(--interactive-accent-hover);
            }
            .biblelink-table-container {
                margin-top: 16px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                overflow: hidden;
            }
            .biblelink-translation-table {
                width: 100%;
                border-collapse: collapse;
                background: var(--background-primary);
            }
            .biblelink-translation-table th {
                background: var(--background-secondary);
                padding: 12px 16px;
                text-align: left;
                font-weight: 600;
                color: var(--text-normal);
                border-bottom: 1px solid var(--background-modifier-border);
                cursor: pointer;
                user-select: none;
            }
            .biblelink-translation-table th:hover {
                background: var(--background-modifier-hover);
            }
            .biblelink-translation-table td {
                padding: 12px 16px;
                border-bottom: 1px solid var(--background-modifier-border);
                color: var(--text-normal);
            }
            .biblelink-translation-table tr:hover {
                background: var(--background-modifier-hover);
            }
            .biblelink-translation-table tr:last-child td {
                border-bottom: none;
            }
            .biblelink-translation-actions {
                display: flex;
                gap: 8px;
                align-items: center;
            }
            .biblelink-translation-actions button {
                padding: 4px 8px;
                font-size: 12px;
                border-radius: 4px;
                border: 1px solid var(--background-modifier-border);
                background: var(--background-primary);
                color: var(--text-normal);
                cursor: pointer;
            }
            .biblelink-translation-actions button:hover {
                background: var(--background-modifier-hover);
            }
            .biblelink-translation-actions button.mod-cta {
                background: var(--interactive-accent);
                color: var(--text-on-accent);
                border-color: var(--interactive-accent);
            }
            .biblelink-translation-actions button.mod-warning {
                background: var(--text-error);
                color: var(--text-on-accent);
                border-color: var(--text-error);
            }
            .biblelink-builtin-label {
                color: var(--text-muted);
                font-style: italic;
                font-size: 12px;
            }
            .biblelink-edit-input {
                width: 100%;
                padding: 4px 8px;
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
                background: var(--background-primary);
                color: var(--text-normal);
            }
            .biblelink-upload-section {
                margin-bottom: 24px;
                padding: 16px;
                background: var(--background-secondary);
                border-radius: 8px;
                border: 1px solid var(--background-modifier-border);
            }
            .biblelink-upload-section h4 {
                margin-top: 0;
                margin-bottom: 8px;
            }
            .biblelink-upload-section p {
                margin-bottom: 16px;
                color: var(--text-muted);
            }
        `;

        const styleEl = document.head.querySelector('#biblelink-table-styles') || document.head.createEl('style', { attr: { id: 'biblelink-table-styles' }});
        styleEl.textContent = css;

        // Add example-specific CSS
        const exampleCss = `
            .biblelink-syntax-example {
                background: var(--background-secondary);
                padding: 12px;
                border-radius: 6px;
                margin-bottom: 16px;
                border-left: 4px solid var(--interactive-accent);
            }
            .biblelink-syntax-text {
                margin: 0;
                font-family: monospace;
                font-weight: 600;
                color: var(--text-normal);
            }
            .biblelink-example-item {
                margin-bottom: 16px;
                padding: 12px;
                background: var(--background-secondary);
                border-radius: 6px;
                border: 1px solid var(--background-modifier-border);
            }
            .biblelink-example-label {
                font-weight: 600;
                margin-bottom: 8px;
                color: var(--text-normal);
            }
            .biblelink-example-code {
                margin: 0;
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 4px;
            }
            .biblelink-example-code code {
                color: var(--text-normal);
            }
        `;

        const exampleStyleEl = document.head.querySelector('#biblelink-example-styles') || document.head.createEl('style', { attr: { id: 'biblelink-example-styles' }});
        exampleStyleEl.textContent = exampleCss;
    }

    private async uploadSQLiteFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.sqlite,.db';
        input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                await this.processSQLiteFile(file);
            }
        };
        input.click();
    }

    private async processSQLiteFile(file: File) {
        try {
            new Notice(`Processing ${file.name}...`);

            const translationName = file.name.replace(/\.(sqlite|db)$/i, '');
            const abbreviation = translationName.toUpperCase();

            // Show modal for customizing translation details
            const modal = new TranslationEditModal(
                this.app,
                translationName,
                abbreviation,
                'English',
                'Standard',
                [],
                async (name: string, abbr: string, language: string, category: string, processingRules: ProcessingRule[]) => {
                    try {
                        // Check if translation already exists
                        const existingTranslations = this.plugin.db.getTranslations();
                        if (existingTranslations.some(t => t.abbreviation === abbr)) {
                            throw new Error(`Translation ${abbr} already exists`);
                        }

                        // Add translation with all details
                        const translationId = await this.plugin.db.addTranslation(name, abbr, language, category, processingRules);

                        // Add sample verses for demonstration
                        const sampleVerses = [
                            { book: 'John', chapter: 3, verse: 16, text: 'Sample verse from uploaded file' },
                            { book: 'Genesis', chapter: 1, verse: 1, text: 'Sample verse from uploaded file' }
                        ];

                        const versesToAdd = sampleVerses.map(verse => ({
                            translationId,
                            book: verse.book,
                            chapter: verse.chapter,
                            verse: verse.verse,
                            text: verse.text
                        }));

                        await this.plugin.db.addVersesBatch(versesToAdd);

                        new Notice(`Successfully imported sample data from ${file.name}`);
                        this.display(); // Refresh the settings display
                    } catch (error) {
                        console.error('SQLite import error:', error);
                        new Notice(`Failed to import ${file.name}: ${error.message}`);
                    }
                },
                false
            );
            modal.open();
        } catch (error) {
            console.error('SQLite import error:', error);
            new Notice(`Failed to import ${file.name}: ${error.message}`);
        }
    }

    private uploadXMLFile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.xml';
        input.onchange = async (event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (file) {
                await this.processXMLFile(file);
            }
        };
        input.click();
    }

    private async processXMLFile(file: File) {
        try {
            new Notice(`Processing ${file.name}...`);

            const text = await file.text();
            const result = await parseStringPromise(text);

            if (!result.XMLBIBLE || !result.XMLBIBLE.BIBLEBOOK) {
                throw new Error('Invalid XML file: missing XMLBIBLE or BIBLEBOOK elements');
            }

            // Extract translation name/abbreviation from biblename attribute
            const biblename = result.XMLBIBLE.$?.biblename || file.name.replace('.xml', '');
            const translationName = biblename;
            const abbreviation = biblename.toUpperCase();

            // Show modal for customizing translation details
            const modal = new TranslationEditModal(
                this.app,
                translationName,
                abbreviation,
                'English',
                'Standard',
                [],
                async (name: string, abbr: string, language: string, category: string, processingRules: ProcessingRule[]) => {
                    try {
                        // Check if translation already exists
                        const existingTranslations = this.plugin.db.getTranslations();
                        if (existingTranslations.some(t => t.abbreviation === abbr)) {
                            const confirmModal = new ConfirmModal(
                                this.app,
                                `Translation '${abbr}' already exists. Overwrite?`,
                                async (confirmed) => {
                                    if (confirmed) {
                                        await this.plugin.db.removeTranslation(abbr);
                                        await this.importXMLBooks(result, name, abbr, file.name, language, category, processingRules);
                                    } else {
                                        new Notice('Import cancelled.');
                                    }
                                    this.display();
                                }
                            );
                            confirmModal.open();
                            return;
                        }

                        await this.importXMLBooks(result, name, abbr, file.name, language, category, processingRules);
                        this.display();
                    } catch (error) {
                        console.error('XML import error:', error);
                        new Notice(`Failed to import ${file.name}: ${error.message}`);
                    }
                },
                false
            );
            modal.open();
        } catch (error) {
            console.error('XML import error:', error);
            new Notice(`Failed to import ${file.name}: ${error.message}`);
        }
    }

    private async importXMLBooks(result: any, translationName: string, abbreviation: string, fileName: string, language: string = 'English', category: string = 'Standard', processingRules: ProcessingRule[] = []) {
        try {
            const books = result.XMLBIBLE.BIBLEBOOK;
            if (!books || books.length === 0) {
                new Notice('No books found in XML. Import aborted.');
                console.error('No books found in XML:', result);
                return;
            }
            // Show progress notice
            new Notice(`Starting import of ${translationName}...`);
            // Add translation to database with all details
            const translationId = await this.plugin.db.addTranslation(translationName, abbreviation, language, category, processingRules);
            let importedCount = 0;
            let bookCount = 0;
            const versesToAdd: Array<{translationId: number, book: string, chapter: number, verse: number, text: string}> = [];
            // Process each book
            for (const book of books) {
                if (!book || !book.$) continue;
                const bookName = book.$.bname || book.$.sname || 'Unknown';
                const chapters = Array.isArray(book.CHAPTER) ? book.CHAPTER : [book.CHAPTER];
                // Process each chapter
                for (const chapter of chapters) {
                    if (!chapter || !chapter.$) continue;
                    const chapterNum = parseInt(chapter.$.cnumber);
                    if (isNaN(chapterNum)) continue;
                    const verses = Array.isArray(chapter.VERS) ? chapter.VERS : (chapter.VERS ? [chapter.VERS] : []);
                    // Process each verse
                    for (const verse of verses) {
                        if (!verse) continue;
                        let verseText = '';
                        let verseNum = 1;
                        // Extract verse text
                        if (typeof verse === 'string') {
                            verseText = verse;
                        } else if (verse._) {
                            verseText = verse._;
                        } else if (Array.isArray(verse)) {
                            verseText = verse.join('');
                        }
                        // Extract verse number
                        if (verse.$ && verse.$.vnumber) {
                            verseNum = parseInt(verse.$.vnumber);
                        }
                        // Add verse if it has content
                        if (verseText && verseText.trim()) {
                            versesToAdd.push({
                                translationId,
                                book: bookName,
                                chapter: chapterNum,
                                verse: verseNum,
                                text: verseText.trim()
                            });
                            importedCount++;
                        }
                    }
                }
                bookCount++;
                // Show progress every 10 books
                if (bookCount % 10 === 0) {
                    new Notice(`Processed ${bookCount} books, ${importedCount} verses...`);
                }
            }
            console.log(`[BibleLink] Parsed ${importedCount} verses from XML for ${translationName}`);
            // Save all verses in a single batch operation
            if (versesToAdd.length > 0) {
                new Notice(`Saving ${importedCount} verses to database...`);
                await this.plugin.db.addVersesBatch(versesToAdd);
                // Verify the import was successful
                const translationExists = this.plugin.db.verifyTranslationExists(abbreviation);
                const translationStats = this.plugin.db.getTranslationStats(abbreviation);
                const allVerses = this.plugin.db['data']?.verses?.filter(v => v.translation_id === translationId) || [];
                console.log(`[BibleLink] Saved ${allVerses.length} verses for ${translationName} (should match ${importedCount})`);
                if (translationExists && translationStats && allVerses.length > 0) {
                    new Notice(`✅ Successfully imported ${translationName} (${abbreviation}) with ${translationStats.verseCount} verses from ${translationStats.books.length} books`);
                    console.log(`Bible import completed: ${translationName} (${abbreviation}) - ${translationStats.verseCount} verses from ${translationStats.books.length} books`);
                } else {
                    new Notice(`❌ Import failed: No verses saved for ${translationName}. Check the XML format and try again.`);
                    console.error(`[BibleLink] Import failed: No verses saved for ${translationName}.`);
                    await this.plugin.db.removeTranslation(abbreviation);
                }
            } else {
                new Notice('❌ No verses were found in the XML file. Import aborted.');
                console.error('[BibleLink] No verses found in XML:', result);
                await this.plugin.db.removeTranslation(abbreviation);
            }
        } catch (error) {
            console.error('XML import error:', error);
            new Notice(`❌ Failed to import ${fileName}: ${error.message}`);
            // Try to clean up if translation was partially added
            try {
                await this.plugin.db.removeTranslation(abbreviation);
            } catch (cleanupError) {
                console.error('Failed to cleanup after import error:', cleanupError);
            }
        }
    }

    private async removeTranslation(abbreviation: string) {
        if (abbreviation === 'ASV') {
            new Notice('Cannot remove ASV translation');
            return;
        }

        const success = await this.plugin.db.removeTranslation(abbreviation);
        if (success) {
            new Notice(`${abbreviation} translation removed`);

            // If the removed translation was the default, reset to ASV
            if (this.plugin.settings.defaultTranslation === abbreviation) {
                this.plugin.settings.defaultTranslation = 'ASV';
                await this.plugin.saveSettings();
            }

            this.display(); // Refresh the settings display
        } else {
            new Notice(`Failed to remove ${abbreviation}: translation not found`);
        }
    }

    private confirmRemoveTranslation(abbreviation: string, name: string) {
        const modal = new ConfirmModal(this.app, `Remove translation '${name}' (${abbreviation})?`, async (confirmed) => {
            if (confirmed) {
                await this.removeTranslation(abbreviation);
            }
            this.display();
        });
        modal.open();
    }

    // --- Shortcut Management Implementation ---
    private renderShortcutsSection(containerEl: HTMLElement) {
        const shortcuts = this.plugin.settings.shortcuts;

        // Filter input
        const filterContainer = containerEl.createDiv({ cls: 'biblelink-filter-container' });
        const filterInput = filterContainer.createEl('input', {
            type: 'text',
            placeholder: 'Filter shortcuts...',
            cls: 'biblelink-filter-input'
        });

        // Create table
        const table = containerEl.createEl('table', { cls: 'biblelink-shortcut-table' });
        const thead = table.createEl('thead');
        const headerRow = thead.createEl('tr');

        // Sort state
        let sortField: 'key' | 'reference' = 'key';
        let sortAsc = true;

        // Create headers with sort functionality
        const createSortableHeader = (text: string, field: 'key' | 'reference') => {
            const th = headerRow.createEl('th', { text });
            th.style.cursor = 'pointer';
            th.onclick = () => {
                if (sortField === field) {
                    sortAsc = !sortAsc;
                } else {
                    sortField = field;
                    sortAsc = true;
                }
                renderShortcuts();
            };
        };

        createSortableHeader('Shortcut', 'key');
        createSortableHeader('Reference', 'reference');
        headerRow.createEl('th', { text: 'Actions' });

        const tbody = table.createEl('tbody');

        const renderShortcuts = () => {
            tbody.empty();
            let shortcutEntries = Object.entries(shortcuts);

            // Apply filter
            const filterText = filterInput.value.toLowerCase();
            if (filterText) {
                shortcutEntries = shortcutEntries.filter(([key, ref]) =>
                    key.toLowerCase().includes(filterText) ||
                    ref.toLowerCase().includes(filterText)
                );
            }

            // Apply sort
            shortcutEntries.sort(([keyA, refA], [keyB, refB]) => {
                const aVal = sortField === 'key' ? keyA : refA;
                const bVal = sortField === 'key' ? keyB : refB;
                return (sortAsc ? 1 : -1) * aVal.localeCompare(bVal);
            });

            shortcutEntries.forEach(([key, reference]) => {
                const row = tbody.createEl('tr');

                if ((this as any)._editingKey === key) {
                    // Edit mode
                    const keyCell = row.createEl('td');
                    const keyInput = keyCell.createEl('input', {
                        type: 'text',
                        value: key,
                        cls: 'biblelink-edit-input',
                        placeholder: 'Shortcut (e.g., jn316)'
                    });

                    const refCell = row.createEl('td');
                    const refInput = refCell.createEl('input', {
                        type: 'text',
                        value: reference,
                        cls: 'biblelink-edit-input',
                        placeholder: 'Reference (e.g., John 3:16)'
                    });

                    const actionCell = row.createEl('td');
                    actionCell.createEl('button', { text: 'Save' }).onclick = async () => {
                        const newKey = keyInput.value.trim();
                        const newRef = refInput.value.trim();

                        if (!newKey || !newRef) {
                            new Notice('Shortcut and reference required');
                            return;
                        }

                        if (newKey !== key && shortcuts[newKey]) {
                            new Notice('Shortcut key already exists');
                            return;
                        }

                        if (!/^\w+\s+\d+:\d+$/.test(newRef) && !/^\w+\s+\d+:\d+(-\d+)?$/.test(newRef)) {
                            new Notice('Reference must be in the format Book Chapter:Verse or Book Chapter:Verse-Verse');
                            return;
                        }

                        // Update shortcut
                        delete shortcuts[key];
                        shortcuts[newKey] = newRef;
                        (this as any)._editingKey = null;
                        await this.plugin.saveSettings();
                        renderShortcuts();
                        new Notice('Shortcut updated');
                    };

                    actionCell.createEl('button', { text: 'Cancel' }).onclick = () => {
                        (this as any)._editingKey = null;
                        renderShortcuts();
                    };
                } else {
                    // View mode
                    row.createEl('td', { text: key });
                    row.createEl('td', { text: reference });
                    const actionCell = row.createEl('td');

                    actionCell.createEl('button', { text: 'Edit' }).onclick = () => {
                        (this as any)._editingKey = key;
                        renderShortcuts();
                    };
                    actionCell.createEl('button', {
                        text: 'Remove',
                        cls: 'mod-warning'
                    }).onclick = () => {
                        const modal = new ConfirmModal(this.app, `Remove shortcut '${key}'?`, async (confirmed) => {
                            if (confirmed) {
                                delete shortcuts[key];
                                await this.plugin.saveSettings();
                                renderShortcuts();
                            }
                        });
                        modal.open();
                    };
                }
            });

            // Add new shortcut row
            if ((this as any)._addingShortcut) {
                const row = tbody.createEl('tr');
                const keyInput = row.createEl('td').createEl('input', {
                    type: 'text',
                    placeholder: 'Shortcut (e.g., jn316)',
                    cls: 'biblelink-edit-input'
                });
                const refInput = row.createEl('td').createEl('input', {
                    type: 'text',
                    placeholder: 'Reference (e.g., John 3:16)',
                    cls: 'biblelink-edit-input'
                });
                const actionCell = row.createEl('td');
                actionCell.createEl('button', { text: 'Add' }).onclick = async () => {
                    const newKey = keyInput.value.trim();
                    const newRef = refInput.value.trim();

                    if (!newKey || !newRef) {
                        new Notice('Shortcut and reference required');
                        return;
                    }

                    if (shortcuts[newKey]) {
                        new Notice('Shortcut key already exists');
                        return;
                    }

                    if (!/^\w+\s+\d+:\d+$/.test(newRef) && !/^\w+\s+\d+:\d+(-\d+)?$/.test(newRef)) {
                        new Notice('Reference must be in the format Book Chapter:Verse or Book Chapter:Verse-Verse');
                        return;
                    }

                    shortcuts[newKey] = newRef;
                    (this as any)._addingShortcut = false;
                    await this.plugin.saveSettings();
                    renderShortcuts();
                    new Notice('Shortcut added');
                };
                actionCell.createEl('button', { text: 'Cancel' }).onclick = () => {
                    (this as any)._addingShortcut = false;
                    renderShortcuts();
                };
            } else {
                const addRow = tbody.createEl('tr');
                const addCell = addRow.createEl('td', { attr: { colspan: '3' } });
                addCell.createEl('button', {
                    text: 'Add Shortcut',
                    cls: 'mod-cta'
                }).onclick = () => {
                    (this as any)._addingShortcut = true;
                    renderShortcuts();
                };
            }
        };

        // Initial render
        renderShortcuts();

        // Add filter listener
        filterInput.addEventListener('input', renderShortcuts);

        // Add CSS
        const css = `
            .biblelink-shortcut-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 10px;
            }
            .biblelink-shortcut-table th,
            .biblelink-shortcut-table td {
                padding: 8px;
                border: 1px solid var(--background-modifier-border);
                text-align: left;
            }
            .biblelink-shortcut-table th {
                background-color: var(--background-secondary);
            }
        `;

        const styleEl = document.head.createEl('style');
        styleEl.textContent = css;
    }
}

class ConfirmModal extends Modal {
    message: string;
    onResult: (confirmed: boolean) => void;
    constructor(app: App, message: string, onResult: (confirmed: boolean) => void) {
        super(app);
        this.message = message;
        this.onResult = onResult;
    }
    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h3', { text: 'Confirm' });
        contentEl.createEl('p', { text: this.message });
        const btnRow = contentEl.createDiv();
        btnRow.style.display = 'flex';
        btnRow.style.gap = '10px';
        btnRow.createEl('button', { text: 'Remove', cls: 'mod-warning' }).onclick = () => {
            this.close();
            this.onResult(true);
        };
        btnRow.createEl('button', { text: 'Cancel' }).onclick = () => {
            this.close();
            this.onResult(false);
        };
    }
    onClose() {
        this.contentEl.empty();
    }
}

class ImportTranslationModal extends Modal {
    name: string;
    abbreviation: string;
    onSubmit: (name: string, abbreviation: string) => void;
    
    constructor(app: App, defaultName: string, defaultAbbr: string, onSubmit: (name: string, abbreviation: string) => void) {
        super(app);
        this.name = defaultName;
        this.abbreviation = defaultAbbr;
        this.onSubmit = onSubmit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.createEl('h3', { text: 'Import Translation' });

        // Name input
        const nameContainer = contentEl.createDiv();
        nameContainer.createEl('label', { text: 'Translation Name:' });
        const nameInput = nameContainer.createEl('input', {
            type: 'text',
            value: this.name,
            placeholder: 'Translation Name'
        });
        nameInput.style.width = '100%';
        nameInput.style.marginBottom = '10px';

        // Abbreviation input
        const abbrContainer = contentEl.createDiv();
        abbrContainer.createEl('label', { text: 'Abbreviation:' });
        const abbrInput = abbrContainer.createEl('input', {
            type: 'text',
            value: this.abbreviation,
            placeholder: 'Abbreviation (e.g., KJV)'
        });
        abbrInput.style.width = '100%';
        abbrInput.style.marginBottom = '20px';

        // Buttons
        const btnContainer = contentEl.createDiv();
        btnContainer.style.display = 'flex';
        btnContainer.style.gap = '10px';
        btnContainer.style.justifyContent = 'flex-end';

        btnContainer.createEl('button', { text: 'Import' }).onclick = () => {
            const name = nameInput.value.trim();
            const abbr = abbrInput.value.trim().toUpperCase();

            if (!name || !abbr) {
                new Notice('Name and abbreviation are required');
                return;
            }

            this.close();
            this.onSubmit(name, abbr);
        };

        btnContainer.createEl('button', { text: 'Cancel' }).onclick = () => {
            this.close();
        };
    }

    onClose() {
        this.contentEl.empty();
    }
} 

class TranslationEditModal extends Modal {
    private name: string;
    private abbreviation: string;
    private language: string;
    private category: string;
    private processingRules: ProcessingRule[];
    private onSubmit: (name: string, abbreviation: string, language: string, category: string, processingRules: ProcessingRule[]) => void;
    private isEdit: boolean;

    constructor(
        app: App, 
        defaultName: string, 
        defaultAbbr: string, 
        defaultLanguage: string = 'English',
        defaultCategory: string = 'Standard',
        defaultProcessingRules: ProcessingRule[] = [],
        onSubmit: (name: string, abbreviation: string, language: string, category: string, processingRules: ProcessingRule[]) => void,
        isEdit: boolean = false
    ) {
        super(app);
        this.name = defaultName;
        this.abbreviation = defaultAbbr;
        this.language = defaultLanguage;
        this.category = defaultCategory;
        this.processingRules = [...defaultProcessingRules];
        this.onSubmit = onSubmit;
        this.isEdit = isEdit;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        contentEl.createEl('h2', { text: this.isEdit ? 'Edit Translation' : 'Add Translation' });

        // Translation Name
        new Setting(contentEl)
            .setName('Translation Name')
            .setDesc('Full name of the translation')
            .addText(text => text
                .setPlaceholder('e.g., American Standard Version')
                .setValue(this.name)
                .onChange(value => {
                    this.name = value;
                }));

        // Abbreviation
        new Setting(contentEl)
            .setName('Abbreviation')
            .setDesc('Short abbreviation for the translation')
            .addText(text => text
                .setPlaceholder('e.g., ASV')
                .setValue(this.abbreviation)
                .onChange(value => {
                    this.abbreviation = value;
                }));

        // Language
        new Setting(contentEl)
            .setName('Language')
            .setDesc('Language of the translation')
            .addDropdown(dropdown => {
                const languages = [
                    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
                    'Russian', 'Chinese', 'Japanese', 'Korean', 'Arabic', 'Hebrew',
                    'Greek', 'Latin', 'Swedish', 'Norwegian', 'Danish', 'Dutch',
                    'Polish', 'Czech', 'Slovak', 'Hungarian', 'Romanian', 'Bulgarian',
                    'Ukrainian', 'Belarusian', 'Serbian', 'Croatian', 'Slovenian',
                    'Estonian', 'Latvian', 'Lithuanian', 'Finnish', 'Icelandic',
                    'Turkish', 'Persian', 'Hindi', 'Bengali', 'Thai', 'Vietnamese',
                    'Indonesian', 'Malay', 'Filipino', 'Other'
                ];
                
                languages.forEach(lang => dropdown.addOption(lang, lang));
                dropdown.setValue(this.language);
                dropdown.onChange(value => {
                    this.language = value;
                });
            });

        // Category
        new Setting(contentEl)
            .setName('Category')
            .setDesc('Category of the translation')
            .addDropdown(dropdown => {
                const categories = [
                    'Standard', 'Study', 'Paraphrase', 'Literal', 'Dynamic',
                    'Historical', 'Catholic', 'Orthodox', 'Protestant',
                    'Jewish', 'Academic', 'Children', 'Other'
                ];
                
                categories.forEach(cat => dropdown.addOption(cat, cat));
                dropdown.setValue(this.category);
                dropdown.onChange(value => {
                    this.category = value;
                });
            });

        // Processing Rules Section
        contentEl.createEl('h3', { text: 'Processing Rules' });
        contentEl.createEl('p', { 
            text: 'Add regex patterns to format verse text. Example: \\[\\w+\\] = <em>$&</em> to make bracketed text italic.',
            cls: 'setting-item-description'
        });

        const rulesContainer = contentEl.createDiv({ cls: 'processing-rules-container' });
        this.renderProcessingRules(rulesContainer);

        // Add Rule Button
        new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Add Processing Rule')
                .onClick(() => {
                    this.processingRules.push({ regex: '', formatting: '', escape: false });
                    this.renderProcessingRules(rulesContainer);
                }));

        // Buttons
        const buttonContainer = contentEl.createDiv({ cls: 'setting-item-control' });
        
        buttonContainer.createEl('button', {
            text: 'Cancel',
            cls: 'mod-warning'
        }).onclick = () => this.close();

        buttonContainer.createEl('button', {
            text: this.isEdit ? 'Update' : 'Add',
            cls: 'mod-cta'
        }).onclick = () => {
            if (this.name.trim() && this.abbreviation.trim()) {
                this.onSubmit(this.name.trim(), this.abbreviation.trim(), this.language, this.category, this.processingRules);
                this.close();
            } else {
                new Notice('Please fill in all required fields');
            }
        };
    }

    private renderProcessingRules(container: HTMLElement) {
        container.empty();
        
        this.processingRules.forEach((rule, index) => {
            const ruleContainer = container.createDiv({ cls: 'processing-rule-item' });
            
            // Regex Pattern
            new Setting(ruleContainer)
                .setName('Regex Pattern')
                .setDesc('Regular expression to match')
                .addText(text => text
                    .setPlaceholder('e.g., \\[\\w+\\]')
                    .setValue(rule.regex)
                    .onChange(value => {
                        this.processingRules[index].regex = value;
                    }));

            // Formatting
            new Setting(ruleContainer)
                .setName('Formatting')
                .setDesc('Replacement text (use $& for matched text)')
                .addText(text => text
                    .setPlaceholder('e.g., <em>$&</em>')
                    .setValue(rule.formatting)
                    .onChange(value => {
                        this.processingRules[index].formatting = value;
                    }));

            // Escape special characters
            new Setting(ruleContainer)
                .setName('Escape special characters')
                .setDesc('Escape [, ], <, >, & in the matched text for HTML output.')
                .addToggle(toggle => toggle
                    .setValue(!!rule.escape)
                    .onChange(value => {
                        this.processingRules[index].escape = value;
                    }));

            // Remove Button
            new Setting(ruleContainer)
                .addButton(button => button
                    .setButtonText('Remove')
                    .setWarning()
                    .onClick(() => {
                        this.processingRules.splice(index, 1);
                        this.renderProcessingRules(container);
                    }));
        });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
} 