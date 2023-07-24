# animated-terminal.js: A customisable animated terminal window using only 2 HTML tags
**animated-terminal.js** lets you render an animated terminal window, with multiple functionalities, using only 2 custom HTML tags, so you can use it without having to write a single line of JavaScript yourself. 

It uses **promises** and **async**/**await**, all in vanilla Javascript, so you don't need ANY additional library.

**animated-terminal.js** started as a fork of [github.com/ines/termynal](github.com/ines/termynal). Then, since I needed some added functionality, I ended up creating my own improved implementation of the terminal, based on 2 main JavaScript components.

![termynal](https://user-images.githubusercontent.com/13643239/26935530-7f4e1152-4c6c-11e7-9e1a-06df36d4f9c9.gif)

![termynal2](https://user-images.githubusercontent.com/13643239/26937306-4d851274-4c71-11e7-94cc-015d30a92e53.gif)


Usage:
<terminal-animation>
 *      <terminal-line data="input">First input line</terminal-line>
 *      <terminal-line data="input">Second input line</terminal-line>
 *      <terminal-line data="input">Third input with <span style="color: red"> red span</span></terminal-line>
 *      <terminal-line>First output line</terminal-line>
 * </terminal-animation>
 * 
 * The <terminal-animation> tag allows only <terminal-line> and <img> tags inside it. All the other nodes will be removed.
 * E.g.:
 * <terminal-animation>
 *      This line will be removed
 *      <terminal-line>This line will be kept</terminal-line>
 *      <div>Also this line will be removed</div>
 * </terminal-animation>
 *
 * The <terminal-line> tag allows only text nodes or <span> tags inside it. All the other nodes will be removed.
 * E.g.:
 * <terminal-line>All this line will be <span>kept</span></terminal-line>
 * <terminal-line>This will be kept but <div>this will be removed</div></terminal-line>
 * 
 * The animation starts only when the terminal becomes visible, unless the 'init'
 * attribute is present (in that case the animation starts right after the page loads).
 * To know all the other possible attributes and what they do please read the specific components.
 * 
 * 
 * List of sub-components editable with the CSS ::part pseudo-element:
 * - Terminal Container -> ::part(terminal-container)
 * - Fast Button -> ::part(fast-button)
 * - Restart Button -> ::part(restart-button)
 * - Directory -> ::part(directory)
 * - Input Character(s) -> ::part(input-character)
 * - Prompt Character(s) -> ::part(prompt-character)
 * - Image -> ::part(img)
 * - Image Icon -> ::part(img-icon)
*/



/**
    * Custom attributes for the <terminal-animation> component:
    * 
    * @param {string} mode - 'light' for light mode; 'dark' for dark mode (default).
    * @param {string} data - Type of prompt for each line of the entire terminal. Choices can be:
    *   - 'output': Output of the terminal. Written all at once; (default)
    *   - 'input': Input to the terminal. Written with typing animation after 'directory' and 'inputChar' attributes;
    *   - 'prompt': Same as input, but with written with typing animation after 'promptChar' attribute;
    *   - 'progress' Line with progress bar animation.
    * @param {number || string} startDelay - Delay before the start of terminal animation, in ms.
    * @param {number || string} lineDelay - Delay before the start of each terminal line animation, in ms.
    * @param {number || string} typingDelay - Delay between each typed character in the terminal, in ms.
    * @param {number || string} imageDelay - Delay before the content inside <img> gets shown, in ms 
    *   (similar to lineDelay, but for <img> tags).
    * @param {number || string} imageTime - Amount of time for an image to stay opened before being minimised, in ms. 
    *   If not present, the image will stay open (You will still be able to click on it to minimise).  
    * @param {string} progressChar – Character(s) to use for progress bar for the entire terminal, defaults to █.
    * @param {number || string} progressPercent - Max percent of progress for the entire terminal, default 100%.
    * @param {string} cursor – Character to use for cursor for the entire terminal, defaults to ▋.
    * @param {string} inputChar – Character(s) to use before the 'input' prompt for the entire terminal, 
    *   defaults to '$'.
    * @param {string} directory – Directory to write in the 'input' prompt before the input character for 
    *   the entire terminal.
    * @param {string} promptChar – Character(s) to use before the 'prompt' prompt for the entire terminal,
    *   defaults to '>>>'.
    * @param {string} PS1 – String to write in the 'input' prompt before the actual line for the entire terminal. 
    *  If present, any 'directory' or 'input' attribute will be disregarded.
    *  Accepts HTML format. E.g.: "This is a <span style='color: green;'>valid</span> PS1 attribute"
    * @param {boolean} init - Initialise the terminal animation at page load.
    * @param {boolean} static - Create a static terminal without animation.
    */




    /**
     * Defining custom attributes for <terminal-line> component
    //  * @param {string} data - Type of prompt for the current line. Choices can be:
    //  *   - 'output': Output of the terminal. Written all at once; (default)
    //  *   - 'input': Input to the terminal. Written with typing animation after 'directory' and 'inputChar' attributes;
    //  *   - 'prompt': Same as input, but with written with typing animation after 'promptChar' attribute;
    //  *   - 'progress' Line with progress bar animation.
    //  * @param {number} lineDelay - Delay before the start of the line animation, in ms.
    //  * @param {number} typingDelay - Delay between each typed character in the line, in ms.
    //  * @param {string} progressChar – Character to use for progress bar in the line, defaults to █.
	//  * @param {number} progressPercent - Max percent of progress in the line, default 100%.
    //  * @param {string} cursor – Character to use for cursor in the line, defaults to ▋.
    //  * @param {string} inputChar – Character(s) to use before the 'input' prompt in the line, defaults to '$'.
    //  * @param {string} directory – Directory to write in the 'input' prompt before the input character in the line.
    //  * @param {string} promptChar – Character(s) to use before the 'prompt' prompt in the line, defaults to '>>>'.
    //  * @param {string} PS1 – String to write in the 'input' prompt before the actual line. 
            If present, any 'directory' or 'input' attribute will be disregarded.
            Accepts HTML format. E.g.: "This is a <span style='color: green;'>valid</span> PS1 attribute"
    //  */


## Examples

* **Simple example:** [CodePen demo](https://codepen.io/ines/full/MoaRYM/), [`example.html`](example.html)
* **Custom example:** [CodePen demo](https://codepen.io/ines/pen/mwegrX), [`example2.html`](example2.html)

## Usage

First, you need to create a container. Each container should have a unique class or ID that tells Termynal where to find the lines to animate. Terminal will find the lines via their `data-ty` attribute and will then animate their text content. Apart from that, it won't mess with your markup – so you're free to add additional styling and attributes.

```html
<div id="termynal" data-termynal>
    <span data-ty="input">pip install spaCy</span>
    <span data-ty="progress"></span>
    <span data-ty>Successfully installed spacy</span>
</div>
```

When you include [`termynal.js`](termynal.js), you can specify the container(s) as the `data-termynal-container` attribute. To initialise Termynal for more than one container, simply add the selectors separated by a `|`, for example `#termynal1|#termynal2`.

```html
<script src="termynal.js" data-termynal-container="#termynal"></script>
```

You also need to include the stylesheet, [`termynal.css`](termynal.css)  in your site's `<head>`:

```html
<link rel="stylesheet" href="termynal.css">
```

That's it!

### Customising Termynal

On each container, you can specify a number of settings as data attributes, and overwrite the animation delay after a line on each individual element.

```html
<div id="termynal" data-ty-startDelay="600" data-ty-cursor="▋">
    <span data-ty="input"> pip install spacy</span>
    <span data-ty data-ty-delay="250">Installing spaCy...</span>
</div>
```

If you don't want to use the HTML API, you can also initialise Termynal in JavaScript. The constructor takes two arguments: the query selector of the container, and an optional object of settings.

```javascript
var termynal = new Termynal('#termynal', { startDelay: 600 })
```

The following settings are available:

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `prefix` | string | `ty` | Prefix to use for data attributes. |
| `startDelay` | number | `600` | Delay before animation, in ms. |
| `typeDelay` | number | `90` | Delay between each typed character, in ms. |
| `lineDelay` | number | `1500` | Delay between each line, in ms. |
| `progressLength` | number | `40` | Number of characters displayed as progress bar. |
| `progressChar` | string | `'█'` | Character to use for progress bar. |
| `cursor` | string | `'▋'` | Character to use for cursor. |
| `noInit` | boolean | `false` | Don't initialise the animation on load. This means you can call `Termynal.init()` yourself whenever and however you want.
| `lineData` | Object[] | `null` | [Dynamically load](#dynamically-loading-lines) lines at instantiation.

## Prompts and animations

Each `<span>` within the container represents a line of code. You can customise the way it's rendered and animated via its data attributes. To be rendered by Termynal, each line needs at least an empty `data-ty` attribute.

### `data-ty`: display and animation style

| Value | Description | Example |
| --- | --- | --- |
| - | Simple output, no typing. | `<span data-ty>Successfuly installed spacy</span>` |
| `input` | Simple prompt with user input and cursor | `<span data-ty="input">pip install spacy</span>` |
| `progress` | Animated progress bar | `<span data-ty="progress"></span>` |

### `data-ty-prompt`: prompt style

The prompt style specifies the characters that are displayed before each line, for example, to indicate command line inputs or interpreters (like `>>>` for Python). By default, Termynal displays a `$` before each user input line.

| Attributes |  Output |
| --- | --- |
| `data-ty="input"` | `$ hello world` |
| `data-ty="input" data-ty-prompt="~"` | `~ hello world` |
| `data-ty="input" data-ty-prompt=">>>"` | `>>> hello world` |
| `data-ty="input" data-ty-prompt=">"` | `> hello world` |
| `data-ty="input" data-ty-prompt="▲"` | `▲ hello world` |
| `data-ty="input" data-ty-prompt="(.env)"` | `(.env) hello world` |
| `data-ty="input" data-ty-prompt="~/user >"` | `~/user > hello world` |

You can also use custom prompts for non-animated output.

To make prompts easy to customise and style, they are defined as `:before` pseudo-elements. Pseudo-elements are not selectable, so the user can copy-paste the commands and won't have to worry about stray `$` or `>>>` characters.

You can change the style by customising the elements in [termynal.css](terminal.css), or add your own rules for specific elements only.

```css
/* Default style of prompts */
[data-ty="input"]:before,
[data-ty-prompt]:before {
    margin-right: 0.75em;
    color: var(--color-text-subtle);
}

/* Make only >>> prompt red */
[data-ty-prompt=">>>"]:before {
    color: red;
}
```

### `data-ty-progressPercent`: set max percent of progress

| Attributes |  Output |
| --- | --- |
| `data-ty="progress"` | `████████████████████████████████████████ 100%` |
| `data-ty="progress" data-ty-progressPercent="81"` | `█████████████████████████████████ 83%` |

### `data-ty-cursor`: display a cursor

Each line set to `data-ty="input"` will be rendered with an animated cursor. Termynal does this by adding a `data-ty-cursor` attribute, and removing it when the line animation has completed (after the delay specified as `lineDelay`). The value of the `data-ty-cursor` sets the cursor style – by default, a small unicode block is used: `▋`. You can set a custom cursor character in the global settings, or overwrite it on a particular line:

```html
<div id="#termynal" data-termynal data-ty-cursor="|">
    <span data-ty="input">Animated with cursor |</span>
    <span data-ty="input" data-ty-cursor="▋">Animated with cursor ▋</span>
</div>
```

You can also change the cursor style and animation in [`termynal.css`](termynal.css):

```css
[data-ty-cursor]:after {
    content: attr(data-ty-cursor);
    font-family: monospace;
    margin-left: 0.5em;
    -webkit-animation: blink 1s infinite;
            animation: blink 1s infinite;
}
```

### Dynamically loading lines

Lines can be dynamically loaded by passing an array of line data objects, using the [attribute suffixes](#data-ty-prompt-prompt-style), as a property of the [settings](#customising-termynal) object.

```javascript
var termynal = new Termynal('#termynal',
    {
        lineData: [
            { type: 'input', value: 'pip install spacy' },
            { value: 'Are you sure you want to install \'spaCy\'?' },
            { type: 'input',  typeDelay: 1000, prompt: '(y/n)', value: 'y' },
            { delay: 1000, value: 'Installing spaCy...' }
        ]
    }
)
```