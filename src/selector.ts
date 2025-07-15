import { App, Modal, Setting, Notice } from 'obsidian';
import { BibleDatabase } from './database';
import BibleLinkPlugin from './main';

export class BibleSelectorModal extends Modal {
    private selectedBook: string | null = null;
    private selectedStartChapter: number = 1;
    private selectedEndChapter: number | null = null;
    private selectedStartVerse: number = 1;
    private selectedEndVerse: number | null = null;
    private selectedTranslation: string | null = null;
    private selectedOutputType: 'text' | 'link' | 'codeblock' = 'codeblock';
    private selectedOptions: string[] = [];
    private db: BibleDatabase;

    // Add these fields to the class
    private referenceInput: import('obsidian').TextComponent;
    private referenceWarning: HTMLElement;
    private translationDropdown: import('obsidian').DropdownComponent;

    constructor(
        app: App,
        private plugin: BibleLinkPlugin,
        private onSubmit: (reference: string, translation: string, outputType: 'text' | 'link' | 'codeblock', options: string[]) => void
    ) {
        super(app);
        this.db = plugin.db;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();

        // Initialize with persistent settings
        this.selectedOutputType = this.plugin.settings.modalOutputType;
        this.selectedOptions = [...this.plugin.settings.modalOptions];

        contentEl.createEl('h2', { text: 'Insert Bible Reference' });

        // Direct Reference Input
        const referenceSetting = new Setting(contentEl)
            .setName('Reference')
            .setDesc('Enter a reference (e.g., John 1:13-25) or use the selectors below.')
            .addText(text => {
                text.setPlaceholder('e.g., John 1:13-25')
                    .onChange((value) => {
                        this.handleReferenceInput(value);
                    });
                this.referenceInput = text;
            });
        this.referenceWarning = contentEl.createEl('div', { cls: 'biblelink-ref-warning' });
        this.referenceWarning.style.color = 'var(--text-warning)';
        this.referenceWarning.style.display = 'none';

        // Translation Selection
        new Setting(contentEl)
            .setName('Translation')
            .setDesc('Choose a Bible translation')
            .addDropdown(dropdown => {
                this.translationDropdown = dropdown;
                const translations = this.db.getTranslations();
                const translationOptions: Record<string, string> = {};
                translations.forEach(trans => {
                    translationOptions[trans.abbreviation] = `${trans.name} (${trans.abbreviation})`;
                });
                dropdown
                    .addOptions(translationOptions)
                    .setValue(this.plugin.settings.defaultTranslation)
                    .onChange(value => {
                        this.selectedTranslation = value;
                        this.renderBookGrid(bookGridContainer);
                        this.renderChapterGrid(chapterGridContainer);
                        this.renderVerseGrid(verseGridContainer);
                    });
            });

        // Book Selection (Grid)
        const bookGridContainer = contentEl.createDiv({ cls: 'biblelink-book-grid-container' });
        this.renderBookGrid(bookGridContainer);

        // Chapter Selection (Grid)
        const chapterGridContainer = contentEl.createDiv({ cls: 'biblelink-chapter-grid-container' });
        this.renderChapterGrid(chapterGridContainer);

        // Verse Selection (Grid)
        const verseGridContainer = contentEl.createDiv({ cls: 'biblelink-verse-grid-container' });
        this.renderVerseGrid(verseGridContainer);

        // Output Type Selection
        new Setting(contentEl)
            .setName('Output Type')
            .setDesc('Choose how to insert the reference')
            .addDropdown(dropdown => dropdown
                .addOption('text', 'Full Verse Text')
                .addOption('link', 'Literal Word Link')
                .addOption('codeblock', 'Code Block')
                .setValue(this.selectedOutputType)
                .onChange(value => {
                    this.selectedOutputType = value as 'text' | 'link' | 'codeblock';
                    this.plugin.settings.modalOutputType = this.selectedOutputType;
                    this.plugin.saveSettings();
                    this.updateOptionsSection();
                }));

        // Options Section (only for code blocks)
        const optionsContainer = contentEl.createDiv();
        this.updateOptionsSection(optionsContainer);



        // Submit Button
        const submitButton = new Setting(contentEl)
            .addButton(button => button
                .setButtonText('Insert')
                .setCta()
                .onClick(() => {
                    this.insertReference();
                }));

        // Inject modern CSS for the modal grids and buttons
        this.injectBibleGridStyles();
    }

    private injectBibleGridStyles() {
        if (document.getElementById('biblelink-modal-style')) return;
        const style = document.createElement('style');
        style.id = 'biblelink-modal-style';
        style.textContent = `
        .biblelink-book-grid-container,
        .biblelink-chapter-grid-container,
        .biblelink-verse-grid-container {
            margin-bottom: 1.2em;
        }
        .biblelink-book-grid,
        .biblelink-chapter-grid,
        .biblelink-verse-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
            gap: 0.5em;
            max-height: 200px;
            overflow-y: auto;
            padding: 0.5em 0;
            background: var(--background-secondary-alt, #23272e);
            border-radius: 8px;
        }
        .biblelink-book-btn,
        .biblelink-chapter-btn,
        .biblelink-verse-btn {
            background: var(--background-primary, #181a20);
            color: var(--text-normal, #e0e0e0);
            border: none;
            border-radius: 6px;
            padding: 0.6em 0.8em;
            font-size: 1em;
            font-family: inherit;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            transition: background 0.15s, color 0.15s, box-shadow 0.15s, border 0.15s;
            outline: none;
        }
        .biblelink-book-btn:hover,
        .biblelink-chapter-btn:hover,
        .biblelink-verse-btn:hover {
            background: var(--interactive-accent, #3a7afe);
            color: #fff;
        }
        .biblelink-book-btn.selected,
        .biblelink-chapter-btn.selected,
        .biblelink-verse-btn.selected {
            background: var(--color-accent, #3a7afe);
            color: #fff;
            font-weight: 600;
            border: 2px solid var(--color-accent-2, #1e4fa3);
            box-shadow: 0 2px 8px rgba(58,122,254,0.15);
        }
        .biblelink-selectall-btn {
            background: var(--background-modifier-hover, #2a2d34);
            color: var(--text-muted, #b0b0b0);
            border: none;
            border-radius: 6px;
            padding: 0.4em 0.8em;
            margin-bottom: 0.5em;
            font-size: 0.95em;
            cursor: pointer;
            transition: background 0.15s, color 0.15s;
        }
        .biblelink-selectall-btn:hover {
            background: var(--interactive-accent, #3a7afe);
            color: #fff;
        }
        .biblelink-book-grid::-webkit-scrollbar,
        .biblelink-chapter-grid::-webkit-scrollbar,
        .biblelink-verse-grid::-webkit-scrollbar {
            width: 8px;
            background: transparent;
        }
        .biblelink-book-grid::-webkit-scrollbar-thumb,
        .biblelink-chapter-grid::-webkit-scrollbar-thumb,
        .biblelink-verse-grid::-webkit-scrollbar-thumb {
            background: var(--background-modifier-border, #444);
            border-radius: 4px;
        }
        @media (max-width: 600px) {
            .biblelink-book-grid,
            .biblelink-chapter-grid,
            .biblelink-verse-grid {
                grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
            }
            .biblelink-book-btn,
            .biblelink-chapter-btn,
            .biblelink-verse-btn {
                font-size: 0.95em;
                padding: 0.5em 0.5em;
            }
        }
        `;
        document.head.appendChild(style);
    }

    // Book grid selection
    private selectedBooks: Set<string> = new Set();
    private renderBookGrid(container: HTMLElement) {
        container.empty();
        const books = this.db.getBooks();
        if (!books || books.length === 0) return;
        const grid = container.createDiv({ cls: 'biblelink-book-grid' });
        books.forEach(book => {
            const btn = grid.createEl('button', {
                text: book,
                cls: 'biblelink-book-btn'
            });
            if (this.selectedBook === book) {
                btn.addClass('selected');
            }
            btn.onclick = (e) => {
                this.selectedBook = book;
                this.selectedStartChapter = 1;
                this.selectedEndChapter = null;
                this.selectedStartVerse = 1;
                this.selectedEndVerse = null;
                this.renderBookGrid(container);
                this.renderChapterGrid(document.querySelector('.biblelink-chapter-grid-container'));
                this.renderVerseGrid(document.querySelector('.biblelink-verse-grid-container'));
                this.updateReferenceInputFromSelection();
                this.updatePreview();
            };
        });
    }

    // Multi-select for chapters
    private selectedChapters: Set<number> = new Set();
    private renderChapterGrid(container: HTMLElement) {
        container.empty();
        if (!this.selectedBook) return;
        const chapters = this.db.getChaptersForBook(this.selectedBook, this.selectedTranslation || this.plugin.settings.defaultTranslation);
        if (!chapters || chapters.length === 0) return;
        const grid = container.createDiv({ cls: 'biblelink-chapter-grid' });
        // Select All button
        const selectAllBtn = container.createEl('button', { text: 'Select All Chapters', cls: 'biblelink-selectall-btn' });
        selectAllBtn.onclick = () => {
            this.selectedChapters = new Set(chapters);
            this.renderChapterGrid(container);
            this.renderVerseGrid(document.querySelector('.biblelink-verse-grid-container'));
            this.updateReferenceInputFromSelection();
        };
        chapters.forEach(chapter => {
            const btn = grid.createEl('button', {
                text: chapter.toString(),
                cls: 'biblelink-chapter-btn'
            });
            if (this.selectedChapters.has(chapter) || this.selectedStartChapter === chapter || (this.selectedEndChapter && chapter >= this.selectedStartChapter && chapter <= this.selectedEndChapter)) {
                btn.addClass('selected');
            }
            btn.onclick = (e) => {
                if (e.ctrlKey || e.metaKey) {
                    if (this.selectedChapters.has(chapter)) {
                        this.selectedChapters.delete(chapter);
                    } else {
                        this.selectedChapters.add(chapter);
                    }
                } else if (e.shiftKey && this.selectedStartChapter) {
                    const start = Math.min(this.selectedStartChapter, chapter);
                    const end = Math.max(this.selectedStartChapter, chapter);
                    for (let c = start; c <= end; c++) {
                        this.selectedChapters.add(c);
                    }
                } else {
                    this.selectedChapters = new Set([chapter]);
                }
                this.selectedStartChapter = chapter;
                this.selectedEndChapter = chapter;
                this.selectedStartVerse = 1;
                this.selectedEndVerse = null;
                this.renderChapterGrid(container);
                this.renderVerseGrid(document.querySelector('.biblelink-verse-grid-container'));
                this.updateReferenceInputFromSelection();
            };
        });
    }

    // Multi-select for verses
    private selectedVerses: Set<number> = new Set();
    private renderVerseGrid(container: HTMLElement) {
        container.empty();
        if (!this.selectedBook || !this.selectedStartChapter) return;
        const verses = this.db.getVersesForChapter(
            this.selectedBook,
            this.selectedStartChapter,
            this.selectedTranslation || this.plugin.settings.defaultTranslation
        );
        if (!verses || verses.length === 0) return;
        const grid = container.createDiv({ cls: 'biblelink-verse-grid' });
        // Select All button
        const selectAllBtn = container.createEl('button', { text: 'Select All Verses', cls: 'biblelink-selectall-btn' });
        selectAllBtn.onclick = () => {
            this.selectedVerses = new Set(verses);
            this.renderVerseGrid(container);
            this.updateReferenceInputFromSelection();
        };
        verses.forEach(verse => {
            const btn = grid.createEl('button', {
                text: verse.toString(),
                cls: 'biblelink-verse-btn'
            });
            if (this.selectedVerses.has(verse) || this.selectedStartVerse === verse || (this.selectedEndVerse && verse >= this.selectedStartVerse && verse <= this.selectedEndVerse)) {
                btn.addClass('selected');
            }
            btn.onclick = (e) => {
                if (e.ctrlKey || e.metaKey) {
                    if (this.selectedVerses.has(verse)) {
                        this.selectedVerses.delete(verse);
                    } else {
                        this.selectedVerses.add(verse);
                    }
                } else if (e.shiftKey && this.selectedStartVerse) {
                    const start = Math.min(this.selectedStartVerse, verse);
                    const end = Math.max(this.selectedStartVerse, verse);
                    for (let v = start; v <= end; v++) {
                        this.selectedVerses.add(v);
                    }
                } else {
                    this.selectedVerses = new Set([verse]);
                }
                this.selectedStartVerse = verse;
                this.selectedEndVerse = verse;
                this.renderVerseGrid(container);
                this.updateReferenceInputFromSelection();
            };
        });
    }

    private updateReferenceInputFromSelection() {
        if (this.referenceInput) {
            let ref = '';
            if (this.selectedBook) {
                ref += this.selectedBook;
                if (this.selectedChapters.size > 0) {
                    const chapters = Array.from(this.selectedChapters).sort((a, b) => a - b);
                    ref += ' ' + chapters.join(',');
                } else if (this.selectedStartChapter) {
                    ref += ' ' + this.selectedStartChapter;
                }
                if (this.selectedVerses.size > 0) {
                    const verses = Array.from(this.selectedVerses).sort((a, b) => a - b);
                    ref += ':' + verses.join(',');
                } else if (this.selectedStartVerse) {
                    ref += ':' + this.selectedStartVerse;
                }
            }
            this.referenceInput.setValue(ref);
        }
    }

    private updateChapterDropdown(container?: HTMLElement) {
        if (!this.selectedBook) return;

        const chapters = this.db.getChaptersForBook(this.selectedBook, this.selectedTranslation || this.plugin.settings.defaultTranslation);
        if (!chapters || chapters.length === 0) return;

        const target = container || document.querySelector('.chapter-container');
        if (!target) return;
        target.empty();
        target.addClass('chapter-container');

        // Start chapter
        new Setting(target)
            .setName('Start Chapter')
            .addDropdown(dropdown => {
                const chapterOptions: Record<string, string> = {};
                chapters.forEach(chapter => {
                    chapterOptions[chapter.toString()] = chapter.toString();
                });
                dropdown
                    .addOptions(chapterOptions)
                    .setValue(this.selectedStartChapter.toString())
                    .onChange(value => {
                        this.selectedStartChapter = parseInt(value);
                        if (!this.selectedEndChapter || this.selectedEndChapter < this.selectedStartChapter) {
                            this.selectedEndChapter = this.selectedStartChapter;
                        }
                        this.updateEndChapterDropdown(target);
                        this.updateVerseDropdown();
                    });
            });

        // End chapter
        this.updateEndChapterDropdown(target);

        // In updateChapterDropdown and updateVerseDropdown, after changing dropdowns, update the text input
        if (this.referenceInput) {
            let ref = this.selectedBook ? this.selectedBook + ' ' + this.selectedStartChapter : '';
            if (this.selectedStartVerse && this.selectedStartVerse !== 0) {
                ref += ':' + this.selectedStartVerse;
                if (this.selectedEndVerse && this.selectedEndVerse !== this.selectedStartVerse) {
                    ref += '-' + this.selectedEndVerse;
                }
            }
            this.referenceInput.setValue(ref);
        }
    }

    private updateEndChapterDropdown(container: HTMLElement) {
        if (!this.selectedBook) return;

        const chapters = this.db.getChaptersForBook(this.selectedBook, this.selectedTranslation || this.plugin.settings.defaultTranslation);
        if (!chapters || chapters.length === 0) return;

        new Setting(container)
            .setName('End Chapter')
            .addDropdown(dropdown => {
                const chapterOptions: Record<string, string> = {};
                chapters
                    .filter(c => c >= this.selectedStartChapter)
                    .forEach(chapter => {
                        chapterOptions[chapter.toString()] = chapter.toString();
                    });
                dropdown
                    .addOptions(chapterOptions)
                    .setValue((this.selectedEndChapter || this.selectedStartChapter).toString())
                    .onChange(value => {
                        this.selectedEndChapter = parseInt(value);
                        this.updateVerseDropdown();
                    });
            });
    }

    private updateVerseDropdown(container?: HTMLElement) {
        if (!this.selectedBook || !this.selectedStartChapter) return;

        const target = container || document.querySelector('.verse-container');
        if (!target) return;
        target.empty();
        target.addClass('verse-container');

        // Start verse
        const startVerses = this.db.getVersesForChapter(
            this.selectedBook,
            this.selectedStartChapter,
            this.selectedTranslation || this.plugin.settings.defaultTranslation
        );

        if (startVerses && startVerses.length > 0) {
            new Setting(target)
                .setName('Start Verse')
                .addDropdown(dropdown => {
                    const verseOptions: Record<string, string> = {
                        '0': 'Entire Chapter'
                    };
                    startVerses.forEach(verse => {
                        verseOptions[verse.toString()] = verse.toString();
                    });
                    dropdown
                        .addOptions(verseOptions)
                        .setValue(this.selectedStartVerse.toString())
                        .onChange(value => {
                            const verseNum = parseInt(value);
                            this.selectedStartVerse = verseNum;
                            if (verseNum === 0) {
                                this.selectedEndVerse = null;
                                this.selectedEndChapter = null;
                            }
                            this.updateEndVerseDropdown(target);
                        });
                });
        }

        // End verse (only show if start verse is not 0)
        if (this.selectedStartVerse !== 0) {
            this.updateEndVerseDropdown(target);
        }

        // In updateChapterDropdown and updateVerseDropdown, after changing dropdowns, update the text input
        if (this.referenceInput) {
            let ref = this.selectedBook ? this.selectedBook + ' ' + this.selectedStartChapter : '';
            if (this.selectedStartVerse && this.selectedStartVerse !== 0) {
                ref += ':' + this.selectedStartVerse;
                if (this.selectedEndVerse && this.selectedEndVerse !== this.selectedStartVerse) {
                    ref += '-' + this.selectedEndVerse;
                }
            }
            this.referenceInput.setValue(ref);
        }
    }

    private updateEndVerseDropdown(container: HTMLElement) {
        if (this.selectedStartVerse === 0) return;

        const endVerses = this.db.getVersesForChapter(
            this.selectedBook,
            this.selectedEndChapter || this.selectedStartChapter,
            this.selectedTranslation || this.plugin.settings.defaultTranslation
        );

        if (!endVerses || endVerses.length === 0) return;

        new Setting(container)
            .setName('End Verse')
            .addDropdown(dropdown => {
                const verseOptions: Record<string, string> = {};
                const minVerse = this.selectedEndChapter === this.selectedStartChapter ? this.selectedStartVerse : 1;
                endVerses
                    .filter(v => v >= minVerse)
                    .forEach(verse => {
                        verseOptions[verse.toString()] = verse.toString();
                    });
                dropdown
                    .addOptions(verseOptions)
                    .setValue((this.selectedEndVerse || this.selectedStartVerse).toString())
                    .onChange(value => {
                        this.selectedEndVerse = parseInt(value);
                    });
            });
    }

    private updateOptionsSection(container?: HTMLElement) {
        if (this.selectedOutputType !== 'codeblock') return;

        const target = container || document.querySelector('.options-container');
        if (!target) return;
        target.empty();
        target.addClass('options-container');

        target.createEl('h3', { text: 'Code Block Options' });

        // Verse numbers
        new Setting(target)
            .setName('Show Verse Numbers')
            .setDesc('Include verse numbers in the output.')
            .addToggle(toggle => toggle
                .setValue(this.selectedOptions.includes('verse'))
                .onChange(value => {
                    this.updateOption('verse', value);
                    this.plugin.settings.modalOptions = [...this.selectedOptions];
                    this.plugin.saveSettings();
                }));

        // Chapter numbers
        new Setting(target)
            .setName('Show Chapter Numbers')
            .setDesc('Include chapter numbers in the output.')
            .addToggle(toggle => toggle
                .setValue(this.selectedOptions.includes('chapter'))
                .onChange(value => {
                    this.updateOption('chapter', value);
                    this.plugin.settings.modalOptions = [...this.selectedOptions];
                    this.plugin.saveSettings();
                }));

        // Red letter text
        new Setting(target)
            .setName('Red Letter Text')
            .setDesc('Highlight words of Jesus in red.')
            .addToggle(toggle => toggle
                .setValue(this.selectedOptions.includes('red-text'))
                .onChange(value => {
                    this.updateOption('red-text', value);
                    this.plugin.settings.modalOptions = [...this.selectedOptions];
                    this.plugin.saveSettings();
                }));

        // Link to Bible Gateway
        new Setting(target)
            .setName('Add External Link')
            .setDesc('Add a link to view the verse on Bible Gateway.')
            .addToggle(toggle => toggle
                .setValue(this.selectedOptions.includes('link'))
                .onChange(value => {
                    this.updateOption('link', value);
                    this.plugin.settings.modalOptions = [...this.selectedOptions];
                    this.plugin.saveSettings();
                }));
    }

    private updateOption(option: string, enabled: boolean) {
        if (enabled && !this.selectedOptions.includes(option)) {
            this.selectedOptions.push(option);
        } else if (!enabled) {
            this.selectedOptions = this.selectedOptions.filter(o => o !== option);
        }
    }



    private insertReference() {
        if (!this.selectedBook) {
            new Notice('Please select a book');
            return;
        }

        // Use default translation if none is selected
        const translation = this.selectedTranslation || this.plugin.settings.defaultTranslation;
        if (!translation) {
            new Notice('Please select a translation');
            return;
        }

        let reference = `${this.selectedBook} ${this.selectedStartChapter}`;
        
        if (this.selectedStartVerse !== 0) {
            reference += `:${this.selectedStartVerse}`;
            
            if (this.selectedEndChapter && this.selectedEndChapter !== this.selectedStartChapter) {
                // Cross-chapter reference
                reference += `-${this.selectedBook} ${this.selectedEndChapter}:${this.selectedEndVerse}`;
            } else if (this.selectedEndVerse && this.selectedEndVerse !== this.selectedStartVerse) {
                // Same chapter reference
                reference += `-${this.selectedEndVerse}`;
            }
        } else if (this.selectedEndChapter && this.selectedEndChapter !== this.selectedStartChapter) {
            // Multiple chapters
            reference += `-${this.selectedEndChapter}`;
        }

        this.onSubmit(reference, translation, this.selectedOutputType, this.selectedOptions);
        this.close();
    }

    // Add this method to handle reference input and sync dropdowns
    private handleReferenceInput(value: string) {
        if (!value || value.trim() === '') {
            this.referenceWarning.style.display = 'none';
            // Clear selections when input is empty
            this.selectedChapters.clear();
            this.selectedVerses.clear();
            return;
        }
        // Parse reference: Book Chapter:Verse[-Verse] or Book Chapter
        const match = value.match(/^([1-3]? ?[A-Za-z ]+)\s+(\d+)(?::(\d+)(?:-(\d+))?)?$/);
        if (!match) {
            this.referenceWarning.style.display = '';
            this.referenceWarning.textContent = 'Unrecognized reference format.';
            return;
        }
        this.referenceWarning.style.display = 'none';
        const [, book, chapter, startVerse, endVerse] = match;
        const bookName = book.trim();
        const chapterNum = parseInt(chapter);
        const startVerseNum = startVerse ? parseInt(startVerse) : 1;
        const endVerseNum = endVerse ? parseInt(endVerse) : (startVerse ? startVerseNum : null);
        // Try to match book to dropdown
        const books = this.db.getBooks();
        const foundBook = books.find(b => b.toLowerCase() === bookName.toLowerCase());
        if (!foundBook) {
            this.referenceWarning.style.display = '';
            this.referenceWarning.textContent = 'Book not found.';
            return;
        }
        
        // Clear grid selections when using manual input
        this.selectedChapters.clear();
        this.selectedVerses.clear();
        
        this.selectedBook = foundBook;
        this.selectedStartChapter = chapterNum;
        this.selectedEndChapter = chapterNum;
        this.selectedStartVerse = startVerseNum;
        this.selectedEndVerse = endVerseNum;
        
        // Ensure translation is set to default if not already selected
        if (!this.selectedTranslation) {
            this.selectedTranslation = this.plugin.settings.defaultTranslation;
        }
        
        // Update translation dropdown to reflect the selected translation
        if (this.translationDropdown) {
            this.translationDropdown.setValue(this.selectedTranslation);
        }
        
        // Update dropdowns
        this.renderBookGrid(document.querySelector('.biblelink-book-grid-container'));
        this.renderChapterGrid(document.querySelector('.biblelink-chapter-grid-container'));
        this.renderVerseGrid(document.querySelector('.biblelink-verse-grid-container'));
        this.updateReferenceInputFromSelection();
    }
} 