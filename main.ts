import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		//✒️Get writing materials
		this.addRibbonIcon('pen-tool', '✒️Get writing materials', async (evt: MouseEvent) => {
			new Notice('🤩Start sorting out your writing materials!');
		
			const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!activeView || !activeView.file) {
				new Notice('No active markdown view to operate on.😭');
				return;
			}
		
			const editor = activeView.editor;
			let docText = editor.getValue();
		
			// Fixed extra line breaks between【】.
			const fixNewlinesBeforeBracketsRegex = /(\n+)(\【.*?\】)/g;
			docText = docText.replace(fixNewlinesBeforeBracketsRegex, '\n$2');
		
			const headingRegex = /^##\s+(.+)$/gm; // Matches level-2 headings
			const bracketContentRegex = /(\【.*?\】)/g; // Match content within 【】, allowing for no text content
			let modifiedText = '';
			let lastIndex = 0;
		
			// Process the text, find and handle all level-2 headings and content within 【】
			docText.replace(headingRegex, (match, titleContent, offset) => {
				modifiedText += docText.slice(lastIndex, offset);
				lastIndex = offset + match.length;
		
				const endOfSectionIndex = docText.indexOf('\n## ', lastIndex);
				const sectionContent = endOfSectionIndex !== -1 ? docText.slice(lastIndex, endOfSectionIndex) : docText.slice(lastIndex);
		
				let modifiedSectionContent = sectionContent.replace(bracketContentRegex, (bracketMatch) => {
					return `\n${bracketMatch}\n### ${bracketMatch}\n${titleContent}\n`;
				});
		
				modifiedText += match + modifiedSectionContent;
				lastIndex = endOfSectionIndex !== -1 ? endOfSectionIndex : docText.length;
		
				return match;
			});
			modifiedText += docText.slice(lastIndex);
		
			// Parse the original file path to get the base name and version information
			const originalFilePath = activeView.file.path;
			const fileNameMatch = originalFilePath.match(/^(.*\/)?([^\/]+?)(?:-(\d+)(?:\.(\d+))?)?(\.md)$/);
		
			if (fileNameMatch) {
				let baseName = fileNameMatch[2];
				let versionNumber = 2; // Set to 2 because we are creating 2.x versions
				let subVersionNumbers = [1, 2]; // Create versions 2.1 and 2.2
		
				const currentDate = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
				const basePath = fileNameMatch[1] || '';
				const promptWithLink = `#### 🎯This version is based on the original file: [[${baseName}-1]]\n`;
		
				// Loop to create 2.1 and 2.2 version files with content and prompt
				for (let i = 0; i < subVersionNumbers.length; i++) {
					let newFileName = `${basePath}${baseName}-${versionNumber}.${subVersionNumbers[i]}_${currentDate}.md`;
					await this.app.vault.create(newFileName, promptWithLink + modifiedText);
					new Notice(`🌱File saved as ${newFileName}`);
				}
		
				// Create an empty version 2.3 file with only the prompt
				let newFileName = `${basePath}${baseName}-${versionNumber}.3_${currentDate}.md`;
				await this.app.vault.create(newFileName, promptWithLink);
				new Notice(`🌱Empty file created as ${newFileName}`);
			} else {
				new Notice('Error: Original file path does not match expected format.😭');
			}
		});
				
 // 
		//await this.loadSettings();
		// This creates an icon in the left ribbon.
		//const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			//new Notice('Welcome to DXMeSH!🔍!');
		//});
		// Perform additional things with the ribbon
		//ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
