/**
 * terminal-animation components
 * Components based on the animated terminal app 'termynal.js' by Ines Montani <ines@ines.io>.
 *
 * @author Davide Marchegiani <davide.marchegiani@gmail.com>
 * @version 1.0.0
 * 
 * The usage is as follow:
 * 
 * <terminal-animation>
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
*/
'use strict';

function replaceTagSymbols(str) {
    /**
    * Replace HTML tag symbols '<' and '>' with HTML enities '&lt;' and '&gt;'
    * for correct usage in directories, PS1, input/promp characters etc.
    */ 
    return str?.replace('<','&lt;').replace('>','&gt;')
}

function sleep(time) {
    /**
    * Sleep for an amount of time
    */
    return new Promise(resolve => setTimeout(resolve, time));
}

function hide(element) {
    /**
    * Change element's style to 'hidden'
    */
    element.style.visibility = 'hidden';
}

function show(element) {
    /**
    * Change element's style to 'visible'
    */
    element.style.visibility = 'visible';
}

const terminalTemplate = document.createElement('template');
terminalTemplate.innerHTML = `
    <style>
        /* Colors injected by 'applyMode' method */

        :host {
            position: relative;
        }

        .terminal-container::-webkit-scrollbar {
            width: 14px;
        }
        
        .terminal-container::-webkit-scrollbar-thumb {
            border-radius: 20px;
            border: 4px solid rgba(0,0,0,0);
            background-clip: padding-box;
            background-color: var(--color-scrollbar);
        }

        .terminal-container {
            word-break: break-all;
            scroll-behavior: smooth;
            scrollbar-gutter: stable;
            max-width: 100%;
            max-height: 510px;
            margin-top: 15px;
            margin-bottom: 15px;
            background-color: var(--color-bg);
            color: var(--color-text);
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            font-size: 13px;
            font-family: 'Roboto Mono', 'Fira Mono', Consolas, Menlo, Monaco, 'Courier New', Courier, monospace;
            font-weight: bold;
            border-radius: 4px;
            padding: 30px 25px 10px;
            position: relative;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-box-sizing: border-box;
                    box-sizing: border-box;
        }

        .terminal-container::before {
            content: '';
            position: absolute;
            top: 12px;
            left: 12px;
            display: flex;
            flex-direction: column;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            /* A little hack to display the window buttons in one pseudo element. */
            background-color: #d9515d;
            -webkit-box-shadow: 0px 0 0 #d9515d, 25px 0 0 #f4c025, 50px 0 0 #3ec930;
                    box-shadow: 0px 0 0 #d9515d, 25px 0 0 #f4c025, 50px 0 0 #3ec930;
        }
        
        .fast-button {
            text-decoration: none;
            position: sticky;
            align-self: flex-end;
            justify-self: center;
            top: 0;
            margin-top: -5px;
            margin-right: -20px;
            color: var(--color-control-buttons);
            z-index: 2;
        }
        
        .fast-button:hover {
            color: var(--color-control-buttons-hover);
        }
        
        .restart-button {
            position: sticky;
            text-decoration: none;
            align-self: flex-end;
            justify-self: center;
            margin-bottom: 0px;
            margin-right: -20px;
            color: var(--color-control-buttons);
            bottom: 0px;
            z-index: 2;
        }

        .restart-button:hover {
            color: var(--color-control-buttons-hover);
        
        }
        
        ::slotted(.img-wrapper) {
            position: sticky;
            top: 0px;
            background-color: purple;
        }

    </style>

    <div class='terminal-container' part="terminal-container" tabindex=-1>
        <slot></slot>
    </div>
`
/* Terminal component */
class TerminalAnimation extends HTMLElement {
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
    * @param {number || string} imageTime - Amount of time for an image to stay opened before being iconified, in ms. 
    *   If not present, the image will stay open (You will still be able to click on it to iconify).  
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
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(terminalTemplate.content.cloneNode(true));
        this.applyMode();
        this.DATA_TYPES = ['input','prompt','progress','output'];
        this.keepLines();
        window.onload = () => { 
            if (!this.static) {
                this.setTerminal();
                if (this.init) {
                    this.initialiseAnimation();
                } else {
                    this.initialiseWhenVisible();
                }
            } else {
                this.generateAllProgress();
                this.setImg();
            }
        }
    }
    
    get container() {
        const container = this.shadowRoot.querySelector(".terminal-container");
        for (let attr of ['lineDelay','typingDelay','imageDelay','imageTime']) {
            if (this.hasAttribute(attr)) {
                container.setAttribute(attr,parseFloat(this.getAttribute(attr)))
            }    
        }
        return container
    }

    get mode() {
        /**
        * Getter for the mode property
        */
        if (this.getAttribute('mode')?.toString().toLowerCase() == 'light') {
            return 'light';
        } else {
            return 'dark';
        }
    }

    get data() {
        /**
        * Getter for the data property
        */
        let attr = this.getAttribute('data');
        if (this.DATA_TYPES.includes(attr)) {
            return attr;
        } else {
            return 'output'
        }
    }

    get startDelay() {
        /**
        * Resets startDelay property.
        */
       return parseFloat(this.getAttribute('startDelay')) || 300;
    }
    
    get _imageDelay() {
        /**
        * Resets lineDelay property.
        */
        if (this.img && this.img.hasAttribute('imageDelay')) {
            this.imageDelay = parseFloat(this.img.getAttribute('imageDelay'));
        } else if (this.hasAttribute('imageDelay')) {
            this.imageDelay = parseFloat(this.getAttribute('imageDelay'));
        } else {
            this.imageDelay = 3000;
        }
    }

    set _imageDelay(time) {
        /**
        * Sets lineDelay property.
        */
        this.imageDelay = time;
    }
    
    get _imageTime() {
        /**
        * Resets lineDelay property.
        */
        if (this.img && this.img.hasAttribute('imageTime')) {
            this.imageTime = parseFloat(this.img.getAttribute('imageTime'));
        } else if (this.hasAttribute('imageTime')) {
            this.imageTime = parseFloat(this.getAttribute('imageTime'));
        } else {
            this.imageTime = false;
        }
    }

    set _imageTime(time) {
        /**
        * Sets lineDelay property.
        */
        this.imageTime = time;
    }

    get progressChar() {
        /**
        * Getter for the progressChar property
        */
        return replaceTagSymbols(this.getAttribute('progressChar')?.toString()) || '█';
    }
    
    get progressPercent() {
        /**
        * Getter for the progressPercent property
        */
        return parseFloat(this.getAttribute('progressPercent')) || 100;
    }
    
    get cursor() {
        /**
        * Getter for the cursor property
        */
        return replaceTagSymbols(this.getAttribute('cursor')?.toString()) || '▋';
    }
    
    get inputChar() {
        /**
        * Getter for the inputChar property
        */
        if (this.hasAttribute('PS1')) {
            return '';
        } else {
            return replaceTagSymbols(this.getAttribute('inputChar')?.toString()) || '$';
        }
    }
    
    get promptChar() {
        /**
        * Getter for the promptChar property
        */
        return replaceTagSymbols(this.getAttribute('promptChar')?.toString()) || '>>>';
    }
    
    get directory() {
        /**
        * Getter for the directory property
        */
        if (this.hasAttribute('PS1')) {
            return '';
        } else {
            return replaceTagSymbols(this.getAttribute('directory')?.toString()) || '';
        }
    }

    get PS1() {
        /**
        * Getter for the PS1 property
        */
        if (this.hasAttribute('PS1')) {
            return this.getAttribute('PS1');
        } else {
            return `<span class="directory" part='directory'>${this.directory}</span><span class="inputChar" part='input-character'>${this.inputChar}&nbsp;</span>`;
        }
    }

    get static() {
        /**
        * Getter for the static property
        */
        let attr = this.getAttribute('static')
        if (attr == 'false') {
            return false
        } else if (attr == "") {
            return true
        } else {
            return !!attr
        }
    }
    
    get init() {
        /**
        * Getter for the init property
        */
        let attr = this.getAttribute('init')
        if (attr == 'false') {
            return false
        } else if (attr == "") {
            return true
        } else {
            return !!attr
        }
    }

    applyMode() {
        /**
        * Sets the color scheme according to the mode selected.
        */
        const colors = document.createElement('style');
        if (this.mode == 'dark') {
            colors.innerHTML = `
                    :host {
                        --color-bg: #252a33;
                        --color-text: #eee;
                        --color-control-buttons: #FAA619;
                        --color-control-buttons-hover: #115D97;
                        --color-scrollbar: rgba(255, 255, 255, .6);
            `
        } else {
            colors.innerHTML = `
                :host {
                    --color-text: #252a33;
                    --color-bg: #eee;
                    --color-control-buttons-hover: #FAA619;
                    --color-control-buttons: #115D97;
                    --color-scrollbar: rgba(0, 0, 0, .6);
            `
        }
        this.shadowRoot.appendChild(colors);
    }

    keepLines() {
        /*
        * Delete all terminal lines without tags or whose tags are not <terminal-line> or <img>
        * Also remove any other img tag after another img tag has been used (Only allow one img per terminal)
        * Create the 'lines' property with the kept lines.
        */
        for (let i=0; i<this.childNodes.length; i++) {
            let node = this.childNodes[i];
            if (node.tagName?.toLowerCase() == 'terminal-line') {
                continue
            } else if (node.tagName?.toLowerCase() == 'img' && ! this.img) {
                    this.img = node;
                    let imgwrapper=document.createElement('div');
                    imgwrapper.classList.add('img-wrapper');
                    this.insertBefore(imgwrapper,node);
                    imgwrapper.appendChild(node);
                    continue
            } else {
                node.remove();
                i--;
            }
        }
        this.lines = this.childNodes;
    }

    async generateAllProgress() {
        this.lines.forEach(line => {
            if (line.data == 'progress') {
                line.generateProgress();
            }
        })
    }

    resetDelays() {
        this.lines.forEach(line => {
            line._lineDelay;
            line._typingDelay;
        })
        this._imageDelay;
        this._imageTime;
    }

    hideLines() {
        /**
        * Hide lines inside the terminal
        */
        this.lines.forEach(line => hide(line));
    }

    generateRestartButton() {
        /**
        * Generate restart button and adds it hidden to 'this.container'
        */
        const restart = document.createElement('a')
        restart.setAttribute('part','restart-button')
        restart.onclick = async e => {
            e.preventDefault();
            this.hideAll();
            this.mutationObserver.disconnect();
            await this.scrollToTop();
            this.initialiseAnimation();
        }
        restart.href = '';
        restart.classList.add('restart-button');
        restart.innerHTML = "restart ↻";
        hide(restart);
        restart.addEventListener('click', e => hide(restart));
        this.restartButton = restart;
        this.container.appendChild(restart);
    }

    generateFastButton() {
        /**
        * Generate fast button and adds it hidden to 'this.container'
        */
        function nullifyDelays(_this) {
            _this.lines.forEach(line => {
                line._lineDelay = 0;
                line._typingDelay = 0;
            })
            _this._imageDelay = 0;
            _this._imageTime = 0;
        }
        const fast = document.createElement('a')
        fast.setAttribute('part','fast-button')
        fast.onclick = (e) => {
            e.preventDefault();
            nullifyDelays(this);
        }
        fast.href = '';
        fast.classList.add('fast-button');
        fast.innerHTML = "fast ❯❯❯";
        hide(fast);
        fast.addEventListener('click', e => hide(fast));
        this.addFocusOnTerminalContainerOnClick(fast);
        this.fastButton = fast;
        this.container.prepend(fast);
    }

    setTerminal() {
        /**
        * Clear container and generate restart/fast buttons.
        */
        this.hideLines();
        this.generateRestartButton();
        this.generateFastButton();
        this.setImg();
        this.generateObservers();
        this.resetDelays();
    }

    hidePS1AndPromptChar() {
        /**
        * Hides PS1 and Prompt Char for terminal reset
        */
        this.lines.forEach(line => {
            let elem = line.shadowRoot?.querySelector('.ps1, .promptChar');
            if (elem) {
                hide(elem);
            }
        })
    }

    hideAll() {
        this.hideLines();
        this.hidePS1AndPromptChar();
    }

    setImg() {
        const img = this.img;
        const containerStyle = getComputedStyle(this.container);
        this.container.style.height = containerStyle.maxHeight;
        const ratio = img.width/img.height;
        const maxWidth = parseFloat(containerStyle.width) - parseFloat(containerStyle.paddingLeft) - parseFloat(containerStyle.paddingRight);
        const maxHeight = parseFloat(containerStyle.height) - parseFloat(containerStyle.paddingTop) - parseFloat(containerStyle.paddingBottom);
        if (img.width > maxWidth) {
            img.width = maxWidth;
        } 
        if (img.height > maxHeight) {
            img.width = maxHeight*ratio;
        }
        const padding = 9;
        // img.style.position = 'absolute';
        // img.style.top = '-294px';
        // img.style.width = '200px';
        // img.style.height = '300px';
        // img.style.marginLeft = `${padding - img.offsetLeft}px`;
        // img.style.marginTop = `${padding - img.offsetTop}px`;
        // img.style.top = `${padding - parseInt(containerStyle.paddingTop)}px`;
        // z-index: 1;
        // border: solid 2px transparent;
        // border-radius: 8px;
        // -webkit-box-sizing: border-box;
        // .img-wrapper:hover) 
        
        // border: solid 2px red;
        // cursor: move;
            
    }
        

    async initialiseAnimation() {
         /**
         * Start the animation and render the lines
         */
        // while (this.container.scrollTop != 0) {await sleep(50)} //Start when the container is scroll up to the top.
        this.autoScroll();
        await sleep(this.startDelay);
        show(this.fastButton);
        for (let line of this.lines) {
            if (line.tagName.toLowerCase() == 'terminal-line') {
                line.classList.add('isBeingTyped');
                // Handle <terminal-line> lines
                await line.type();
                line.classList.remove('isBeingTyped');
            } else if (line.classList.contains('img-wrapper')) {
                // Handle <img> lines
                await sleep(this.imageDelay);
                show(line);
                if (this.imageTime || this.imageTime === 0) {
                    await sleep(this.imageTime);
                    // hide(line);
                }
            }
        }
        hide(this.fastButton);
        this.resetDelays();
        show(this.restartButton);
    }

    initialiseWhenVisible() {
        /**
        * Initialise the terminal only when it becomes visible
        */
        let observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.initialiseAnimation();
                    observer.unobserve(this);
                }
            })
        },
        {
            rootMargin: "-50px",
        })
        observer.observe(this);
    }

    addFocusOnTerminalContainerOnClick(elem) {
        elem.addEventListener('click',() => this.container.focus(), {passive: true})
    }

    scrollToTop() {
    // Scroll to the top of the container.
        this.container.scrollTop = 0
        return new Promise(resolve => {
            const scrollHandler = () => {
                if (this.container.scrollTop == 0) {
                    this.container.removeEventListener("scroll", scrollHandler);
                    resolve();
                }
            }
            if (this.container.scrollTop == 0) {
                resolve();
            } else {
                this.container.addEventListener("scroll", scrollHandler, {passive: true});
            }
        });
    }
    
    scrollToBottom() {
    // Scroll to the bottom of the container.
        this.container.scrollTop = this.container.scrollHeight;
        return new Promise(resolve => {
            const scrollHandler = () => {
                if (this.container.scrollTop = this.container.scrollHeight) {
                    this.container.removeEventListener("scroll", scrollHandler);
                    resolve();
                }
            }
            if (this.container.scrollTop = this.container.scrollHeight) {
                resolve();
            } else {
                this.container.addEventListener("scroll", scrollHandler, {passive: true});
            }
        });
    }
    
    scrollOneLine(line) {
        const nPix = parseInt(getComputedStyle(line).height);
        this.container.scrollBy(0,nPix);
    }

    generateObservers() {
        const intersectionFunction = entry => {
            if (entry.intersectionRatio == 1) {
                intersectionObserver.unobserve(entry.target);
            } else {
                if (entry.target.nextSibling) {
                    this.scrollOneLine(entry.target);
                }
                intersectionObserver.unobserve(entry.target);
            }
        }
           
        let margin = `${parseInt(getComputedStyle(this.container).marginBottom) - 5}px` // Margin of the intersectionObserver computed as bottom margin - 5px (5px padding)
        let intersectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                intersectionFunction(entry)
            })
        },
        {
            root: this.container,
            rootMargin: `0px 0px ${margin} 0px`,
        })
        
        const mutationFunction = async entry => {
            let nextSibling = entry.target.nextSibling;
            if (nextSibling) {
                if (nextSibling.tagName.toLowerCase() == 'terminal-line') {
                    intersectionObserver.observe(nextSibling)
                } else if (nextSibling.nextSibling) {
                    intersectionObserver.observe(nextSibling.nextSibling)
                } else {
                    await this.scrollToBottom();    
                }
            } else {
                await this.scrollToBottom();
            }
        }

        this.mutationObserver = new MutationObserver(entries => {
            entries.forEach(entry => {
                if (entry.oldValue?.includes("isBeingTyped")) {
                    mutationFunction(entry)
                }
            })
        })
    }
    
    autoScroll() {
        /**
        * Auto scrolls 1 line if the terminal content exceeds the terminal max-height.
        */
        this.lines.forEach(line => {
            if (line.tagName.toLowerCase() == 'terminal-line') {
                this.mutationObserver.observe(line,{
                    attributes: true,
                    attributeOldValue: true,
                    attributeFilter: ["class"]
                })
            }
        });

        this.addEventListener('wheel', e => {
            this.mutationObserver.disconnect();
        }, {passive: true})

        this.addEventListener('keydown', e => {
            if (['ArrowDown','Space','ArrowUp'].includes(e.code)) {
                this.mutationObserver.disconnect();
            }
        }, {passive: true})
    }
}

/* =============================================================================================================
 ===============================================================================================================
 ===============================================================================================================
 ===============================================================================================================
 ===============================================================================================================
 ===============================================================================================================
 ===============================================================================================================
 ===============================================================================================================
 ===============================================================================================================
 ===============================================================================================================
 =============================================================================================================== */

 /* Terminal line */
const lineTemplate = document.createElement('template');
lineTemplate.innerHTML = `
    <style>
        :host {
            --color-text-prompt: #a2a2a2;
            --color-text-directory: #A6CE39;
            --color-text-symlink: #06AEEF;
            --color-text-inputchar: #FAA619;
            display: grid;
        }
        
        div.terminal-line {
            line-height: 1.5em;
            display: inline;
            align-self: center;
        }
        
        span.directory {
            color: var(--color-text-directory);
        }
        
        span.inputChar {
            color: var(--color-text-inputchar);
        }
    </style>
    
    <body>
        <div class='terminal-line'><slot></slot></div>
    </body>
    
`

class TerminalLine extends HTMLElement {
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
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.appendChild(lineTemplate.content.cloneNode(true));
        this.ALLOWED_NODES = ["span"];
        this.line = this.shadowRoot.querySelector(".terminal-line");
        this.setCursorChar();
        this.keepNodes();
        this.generatePS1AndPromptCharElements();
        this.resetDelays();
        this.container.addFocusOnTerminalContainerOnClick(this);
    }
    
    get container() {
        if (this.parentElement.tagName.toLowerCase() != 'terminal-animation') {
            throw new Error("A 'terminal-line' tag can only be placed inside a 'terminal-animation' tag.");
        }
        return this.parentElement;
    }

    get data() {
        /**
        * Getter for the data property
        */
        if (this.hasAttribute('data')) {
            let attr = this.getAttribute('data');
            if (this.container.DATA_TYPES.includes(attr)) {
                return attr;
            } else {
                return 'output';
            }
        } else {
            return this.container.data;
        }
    }
    
    get _lineDelay() {
        /**
        * Resets lineDelay property.
        */
        if (this.hasAttribute('lineDelay')) {
            this.lineDelay = parseFloat(this.getAttribute('lineDelay'));
        } else if (this.container.hasAttribute('lineDelay')) {
            this.lineDelay = parseFloat(this.container.getAttribute('lineDelay'));
        } else if (["input","prompt"].includes(this.data)) {
            this.lineDelay = 600;
        } else {
            this.lineDelay = 100;
        }
    }

    set _lineDelay(time) {
        /**
        * Sets lineDelay property.
        */
        this.lineDelay = time;
    }
    
    get _typingDelay() {
        /**
        * Resets typingDelay property.
        */
        if (this.hasAttribute('typingDelay')) {
            this.typingDelay = parseFloat(this.getAttribute('typingDelay'));
        } else if (this.container.hasAttribute('typingDelay')) {
            this.typingDelay = parseFloat(this.container.getAttribute('typingDelay'));
        } else if (["progress"].includes(this.data)) {
            this.typingDelay = 30;
        } else {
            this.typingDelay = 80;
        }
    }
    
    set _typingDelay(time) {
        /**
        * Sets typingDelay property.
        */
        this.typingDelay = time;
    }
    
    resetDelays() {
        this._lineDelay;
        this._typingDelay;
        this.container._imageDelay;
        this.container._imageTime;
    } 
    
    get progressChar() {
        /**
        * Getter for the progressChar property
        */
        return replaceTagSymbols(this.getAttribute('progressChar')?.toString()) || this.container.progressChar;
    }
    
    get progressPercent() {
        /**
        * Getter for the progressPercent property
        */
        return parseFloat(this.getAttribute('progressPercent')) || this.container.progressPercent;
    }
    
    get cursor() {
        /**
        * Getter for the cursor property
        */
        return replaceTagSymbols(this.getAttribute('cursor')?.toString()) || this.container.cursor;
    }
    
    get inputChar() {
        /**
        * Getter for the inputChar property
        */
        if (this.hasAttribute('PS1')) {
            return '';
        } else {
            return replaceTagSymbols(this.getAttribute('inputChar')?.toString()) || this.container.inputChar;
        }
    }
    
    get promptChar() {
        /**
        * Getter for the promptChar property
        */
        return replaceTagSymbols(this.getAttribute('promptChar')?.toString()) || this.container.promptChar;
    }
    
    get directory() {
        /**
        * Getter for the directory property
        */
        if (this.hasAttribute('PS1')) {
            return '';
        } else {
            return replaceTagSymbols(this.getAttribute('directory')?.toString()) || this.container.directory;
        }
    }

    get PS1() {
        /**
        * Getter for the PS1 property
        */
        if (this.hasAttribute('PS1')) {
            return this.getAttribute('PS1');
        } else if (this.hasAttribute('directory') || this.hasAttribute('inputChar')) {
            return `<span class="directory" part='directory'>${this.directory}</span><span class="inputChar" part="input-character">${this.inputChar}&nbsp;</span>`;
        } else {
            return this.container.PS1;
        }
    }

    setCursorChar() {
        const style = document.createElement('style');
        style.innerHTML=`
            .cursor::after {
                content: '${this.cursor}';
                font-family: monospace;
                -webkit-animation: blink 1s infinite;
                        animation: blink 1s infinite;
            }
            
            @-webkit-keyframes blink {
                50% {
                    opacity: 0;
                }
            }
    
            @keyframes blink {
                50% {
                    opacity: 0;
                }
            }
        `
        this.shadowRoot.appendChild(style);
    }

    keepNodes(elementList=this.ALLOWED_NODES) {
        /*
        * Delete all line nodes whose tags are not within the elementList, 
        * create <span> tags around textNodes,
        * and create the nodes property with the kept ones.
        */
        for (let i=0; i<this.childNodes.length; i++) {
            let node = this.childNodes[i];
            if (node.nodeType == 3) {
                let span = document.createElement('span');
                this.insertBefore(span,node);
                span.appendChild(node);
            } else if (!elementList.includes(node.tagName.toLowerCase())) {
                node.remove();
                i--;
            }
        }
        this.nodes = Array.from(this.childNodes);
    }

    showPS1() {
        show(this.shadowRoot.querySelector('.ps1'));
    }
    
    showPromptChar() {
        show(this.shadowRoot.querySelector('.promptChar'));
    }

    async type() {
        /**
        * Function that handles the animation of the current line based on its data property
        */
        if (this.data == 'input') {
            this.showPS1();
            await this.typeInput();
        } else if (this.data == 'progress') {
            await sleep(this.lineDelay);
            await this.typeProgress();
            return;
        } else if (this.data == 'prompt') {
            this.showPromptChar();
            await this.typeInput();
        } else {
            await sleep(this.lineDelay);
            show(this)
        }

    }

    measureChar(char=this.progressChar) {
        const ruler = document.createElement('span');
        ruler.innerHTML = char;
        ruler.style.whiteSpace = 'pre';
        this.appendChild(ruler);
        const width = ruler.offsetWidth;
        this.removeChild(ruler);
        return width;
    }

    async typeProgress() {
        /**
        * Animate a progress bar.
        */
        const progressCharWidth = this.measureChar();
        const progressSteps = Math.round((parseInt(getComputedStyle(this).width)*0.8*(this.progressPercent/100))/progressCharWidth);
        let percent = 0;
        this.textContent = '0%';
        show(this);
        for (let i=1; i<=progressSteps; i++) {
            await sleep(this.typingDelay);
            percent = Math.round(this.progressPercent/progressSteps*i)
            this.textContent = `${this.progressChar.repeat(i)} ${percent}%`;
        }
    }

    generateProgress() {
        const progressCharWidth = this.measureChar();
        const progressLength = Math.round((parseInt(getComputedStyle(this).width)*0.8*(this.progressPercent/100))/progressCharWidth);
        this.textContent = `${this.progressChar.repeat(progressLength)} ${this.progressPercent}%`;
    }

    async typeInput() {
         /**
         * Animate an input line.
         */
        let textArray = this.getAndRemoveTextContent();
        show(this);
        this.addCursor();
        await sleep(this.lineDelay);
        for (let i=0; i<this.nodes.length; i++) {
            let node = this.nodes[i];
            let text = textArray[i];
            for (let char of text) {
                await sleep(this.typingDelay);
                node.textContent += char;
            }
        }
        this.removeCursor();
    }

    getAndRemoveTextContent() {
        let textArray = [];
        for (let node of this.nodes) {
            textArray.push(node.textContent);
            node.textContent = "";
        }
        return textArray;
    }

    addCursor() {
        this.line.classList.add('cursor');
    }
    
    removeCursor() {
        this.line.classList.remove('cursor');
    }

    generatePS1AndPromptCharElements() {
        let elem = document.createElement('div');
        elem.style.display="inline";
        if (this.data == 'input') {
            elem.innerHTML = this.PS1;
            elem.classList.add('ps1');
            this.PS1Element = elem;
            this.line.prepend(elem)
        } else if (this.data == 'prompt') {
            elem.innerHTML = `${this.promptChar} `;
            elem.classList.add('promptChar');
            elem.setAttribute('part','prompt-character');
            this.promptCharElement = elem;
            this.line.prepend(elem)
        }
        if (!this.parentElement.static) {
            hide(elem);
        }
    }
}

customElements.define("terminal-animation", TerminalAnimation)
customElements.define("terminal-line", TerminalLine)