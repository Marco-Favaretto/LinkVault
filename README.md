# LinkVault
Project made for the purpose of developing a browser extension.

## Functionalities
- save a link
- categorize and tag your saved links
- search and filter your saved links

## How To Use.
Clicking on the extension logo will open up a popup with a form. On the form you can insert a title, the link, a category, one or more tags (separated by comma) and an optional description. By default, title and link fields are automatically filled with the current page's info.

Clicking on the `gestisci` button on the top right corner will open a new tab with a dashboard. Here you can see all your links, search (text-search matching on title, category, tags and description) and filter them byt category and tags.

## How to install
You can install this extension manually by loading it as an unpacked extension in your browser.

### Chrome-based / Edge
1. Download the latest release from the **Releases** page.
2. Extract the downloaded ZIP file to a folder on your computer.
3. Open your browser and navigate to settings > extensions.
4. Enable **Developer mode**.
5. Click **Load unpacked**.
6. Select the extracted extension folder.
7. The extension will be installed and ready to use.

### Safari (macOS) - (AI suggestion, not tested)
1. Download the source code and extract it to a folder on your computer.
2. Open Terminal and convert the extension for Safari by running:
    ```sh
    xcrun safari-web-extension-converter /path/to/extracted/folder
    ```
    This command will generate a native Xcode project. 
3. Open the generated project in Xcode.
4. In Xcode, select your build target and click the Run button (Play icon) to build and run the app wrapper.
5. Open Safari and go to Settings (or Preferences) > Advanced.
6. Check the box "Show features for web developers" (or "Show Develop menu in menu bar").
7. In the newly appeared Developer menu in Safari's top bar, click "Allow Unsigned Extensions".
8. Go to Safari Settings > Extensions, and check the box next to LinkVault to enable it.

### Updating
To update the extension manually:

1. Download the latest release.
2. Replace the old extension files with the new ones.
3. Go to the extensions page and click **Reload** on the extension, or remove and load it again if necessary.
