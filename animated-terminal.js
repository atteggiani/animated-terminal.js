/**
 * @author Davide Marchegiani <davide.marchegiani@gmail.com>
 * @version 3.1
 */

'use strict';

function replaceTagSymbols(str) {
    /**
    * Replace HTML tag symbols '<' and '>' with HTML enities '&lt;' and '&gt;'
    * for correct usage in directories, PS1, input/promp characters etc.
    */ 
    return str?.replaceAll('<','&lt;').replaceAll('>','&gt;')
}

function sleep(time, signal = null) {
    /**
    * Sleep for an amount of time with the possibility to be aborted
    */
    if (! signal?.aborted) {
        return new Promise((resolve,reject) => {
            const timeout = setTimeout(resolve, time);
            if (signal) {
                signal.addEventListener('abort', () => {
                    clearTimeout(timeout);
                    resolve();
                },
                {once: true})
            }
        });
    }
}

function hide(element) {
    /**
    * Change element's style to 'hidden'
    */
    element.style.visibility = 'hidden';
}

function show(element, signal = null) {
    /**
    * Change element's style to 'visible'
    */
    if (! signal?.aborted) {
        element.style.visibility = 'visible';
    }
}

const terminalTemplate = document.createElement('template');
terminalTemplate.innerHTML = `
    <style>
        /* Colors injected by 'applyMode' method */

        :host {
            position: relative;
        }

        .terminal-window::-webkit-scrollbar {
            width: 14px;
        }
        
        .terminal-window::-webkit-scrollbar-thumb {
            border-radius: 20px;
            border: 4px solid rgba(0,0,0,0);
            background-clip: padding-box;
            background-color: var(--color-scrollbar);
        }

        .terminal-window {
            word-break: break-all;
            scroll-behavior: smooth;
            scrollbar-gutter: stable;
            max-width: 100%;
            min-width: 150px;
            max-height: 510px;
            margin-top: 15px;
            margin-bottom: 15px;
            background-color: var(--color-bg);
            color: var(--color-text);
            display: block;
            flex-direction: column;
            justify-content: flex-start;
            font-size: 13px;
            font-family: 'Roboto Mono', 'Fira Mono', Consolas, Menlo, Monaco, 'Courier New', Courier, monospace;
            font-weight: bold;
            border-radius: 8px;
            padding: 30px 25px 25px;
            position: relative;
            overflow-y: auto;
            overflow-x: hidden;
            box-sizing: border-box;
        }

        .terminal-window::before {
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
            -webkit-box-shadow: 0px 0 0 #d9515d, 20px 0 0 #f4c025, 40px 0 0 #3ec930;
                    box-shadow: 0px 0 0 #d9515d, 20px 0 0 #f4c025, 40px 0 0 #3ec930;
        }

        .fast-button-wrapper {
            position: sticky;
            top: 0px;
            z-index: 2;
        }
        
        .fast-button-wrapper:hover {
            cursor: pointer;
        }
        
        .fast-button {
            position: absolute;
            color: var(--color-control-buttons);
            width: max-content;
            text-align: center;
            top: var(--top);
            right: var(--right);
        }
        
        .fast-button:hover {
            color: var(--color-control-buttons-hover);
        }

        .restart-button-wrapper {
            position: sticky;
            height: fit-content;
            top: var(--top);
            z-index: 2;
        }
        
        .restart-button-wrapper:hover {
            cursor: pointer;
        }

        .restart-button {
            position: absolute;
            color: var(--color-control-buttons);
            width: max-content;
            text-align: center;
            top: 0px;
            right: -15px;
        }

        .restart-button:hover {
            color: var(--color-control-buttons-hover);
        }
        
        .img-icon-wrapper {
            position: absolute;
            height: var(--height);
            top: 0px;
            margin-top: 0px;
            right: var(--right);
            z-index: 0;
        }
        
        .img-icon {
            position: sticky;
            top: var(--top);
            text-align: center;
        }
        
        .img-icon:hover {
            cursor: pointer;
        }
        
        .img-icon > svg {
            color: var(--color-control-buttons);
        }
        
        .img-icon > svg:hover {
            color: var(--color-control-buttons-hover);
        }

        .img-wrapper {
            position: absolute;
            width: fit-content;
            height: var(--height);
            top: 0px;
            margin-top: 0px;
        }
        
        .img-wrapper > img {
            position: sticky;
            max-height: calc(var(--max-height) - 20px);
            margin-left: -15px;
            top: -20px;
            border-radius: 7px;
            border: solid 2px transparent;
            z-index: 1;
        }
        
        .img-wrapper > img:hover {
            border-color: var(--color-control-buttons);
            cursor: pointer;
        }
        
        .img-wrapper > img:active {
            cursor: default;
        }
        
    </style>
    <body>
        <div class='terminal-window' part="terminal-window" tabindex=-1>
            <slot></slot>
        </div>
    </body>
`
/* terminal-window component */
class TerminalWindow extends HTMLElement {
    /**
    * Custom attributes for the <terminal-window> component:
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
    constructor() {
        super();
        this.DATA_TYPES = ['input','prompt','progress','output'];
        // Attach shadowDOM
        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(terminalTemplate.content.cloneNode(true));
    }

    connectedCallback() {
        // Keep only proper lines
        this.keepLines();
        // Apply colormode
        this.applyMode();
        this.createAbortControllers();
        // Wait for terminal-lines to load, then continue
        this.linesReady().then(() => {
            this.setTerminal();
            this.applyStatic();
            this.initialise();
        })
    }
    
    get window() {
        const window = this.shadowRoot.querySelector(".terminal-window");
        for (let attr of ['lineDelay','typingDelay','imageDelay','imageTime']) {
            if (this.hasAttribute(attr)) {
                window.setAttribute(attr,parseFloat(this.getAttribute(attr)))
            }    
        }
        return window
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
    
    get imageDelay() {
        /**
        * Resets lineDelay property.
        */
        if (this.img && this.img.img.hasAttribute('imageDelay')) {
            return parseFloat(this.img.img.getAttribute('imageDelay'));
        } else if (this.hasAttribute('imageDelay')) {
            return parseFloat(this.getAttribute('imageDelay'));
        } else {
            return 1500;
        }
    }
    
    get imageTime() {
        /**
        * Resets lineDelay property.
        */
        if (this.img && this.img.img.hasAttribute('imageTime')) {
            return parseFloat(this.img.img.getAttribute('imageTime')) ? parseFloat(this.img.img.getAttribute('imageTime')) : this.img.img.getAttribute('imageTime');
        } else if (this.hasAttribute('imageTime')) {
            return parseFloat(this.getAttribute('imageTime')) ? parseFloat(this.getAttribute('imageTime')) : this.img.img.getAttribute('imageTime');
        } else {
            return 3000;
        }
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
    
    async resetTerminal() {
        this.hideAll();
        this.abortControllerFast.abort();
        this.abortControllerReset.abort();
        await sleep(1)
        this.setTerminal();
        this.applyStatic();
        this.restartFunction();
    }

    createAbortControllers() {
        this.abortControllerFast = new AbortController();
        this.abortControllerReset = new AbortController();
    }

    linesReady() {
        let lineReadyPromises = [];
        this.lines.forEach(line => {
            lineReadyPromises.push(new Promise(async resolve => {
                while (!line.ready) {
                    await sleep(1);
                }
                resolve();
            }))
        })
        return Promise.all(lineReadyPromises)
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
        * Delete all terminal lines without tags or whose tags are not <terminal-line> or <img> (only first one, others are deleted)
        * Also create the 'img' property if <img> tag is present, remove img node from lines and append it to shadowDOM
        * Create the 'lines' property with the kept lines.
        */
        for (let i=0; i<this.childNodes.length; i++) {
            let node = this.childNodes[i];
            if (node.tagName?.toLowerCase() == 'img' && ! this.img) {
                this.img = {
                    img: node,
                    index: i,
                }
                this.generateImg(node);
                i--;
            } else if (node.tagName?.toLowerCase() != 'terminal-line') {
                node.remove();
                i--;
            } else {
                hide(node);
            }
        }
        this.lines = this.childNodes;
    }

    generateImg(node) {
        // Create img wrapper for sticky behaviour
        hide(node);
        let imgwrapper = document.createElement('div');
        imgwrapper.classList.add('img-wrapper');
        this.window.appendChild(imgwrapper);
        imgwrapper.appendChild(node);
        node.setAttribute('part','img');
        node.setAttribute('title','Click to minimise image');
        // Change window height
        const windowStyle = getComputedStyle(this.window);
        this.window.setAttribute('style',`--max-height: ${windowStyle.maxHeight};`);
        this.window.style.height = windowStyle.maxHeight;
    }

    async generateAllProgress() {
        this.lines.forEach(line => {
            if (line.data == 'progress') {
                line.generateProgress();
            }
        })
    }

    hideLines() {
        /**
        * Hide lines inside the terminal
        * Hide PS1 and Prompt Char for terminal reset
        */
        this.lines.forEach(line => {
            hide(line);
            let elem = line.shadowRoot?.querySelector('.ps1, .promptChar');
            if (elem) {
                hide(elem);
            }
        })
    }
    
    showLines() {
        /**
        * Show lines inside the terminal
        * Show PS1 and Prompt Char for terminal reset
        */
        this.lines.forEach(line => {
            show(line, this.abortControllerReset.signal);
            let elem = line.shadowRoot?.querySelector('.ps1, .promptChar');
            if (elem) {
                show(elem, this.abortControllerReset.signal);
            }
        })
    }

    async restartFunction() {
        this.createAbortControllers();
        this.hideAll();
        this.mutationObserverLineBeingTyped.disconnect();
        await this.scrollToTop();
        this.initialiseWhenVisible();
    }

    generateRestartButton() {
        /**
        * Generate restart button and adds it hidden to 'this.window'
        */
        const restart = document.createElement('div')
        restart.setAttribute('part','restart-button')
        restart.addEventListener('click', () => {
            this.window.focus();
            this.restartFunction();
        },
        {passive: true})
        restart.classList.add('restart-button');
        restart.innerHTML = "restart ↻";
        this.restartButton = restart;
        this.window.appendChild(restart);
        let wrapper = document.createElement('div')
        wrapper.classList.add('restart-button-wrapper');
        wrapper.appendChild(restart);
        this.window.prepend(wrapper);
        hide(restart);
    }

    generateFastButton() {
        /**
        * Generate fast button and adds it hidden to 'this.window'
        */
        const nullifyDelays = () => {
            this.lines.forEach(line => {
                line._lineDelay = 0;
                line._typingDelay = 0;
            })
            this._imageDelay = 0;
            this._imageTime = 0;
        }
        const fast = document.createElement('div')
        fast.setAttribute('part','fast-button')
        const fastFunction = async (e) => {
            hide(fast);
            this.window.focus();
            this.abortControllerFast.abort();
        }
        fast.addEventListener('click', fastFunction, {passive: true});
        fast.classList.add('fast-button');
        fast.innerHTML = "fast ❯❯❯";
        this.fastButton = fast;
        let wrapper = document.createElement('div')
        wrapper.classList.add('fast-button-wrapper');
        wrapper.appendChild(fast);
        this.window.prepend(wrapper);
        let top = -(parseFloat(getComputedStyle(fast).fontSize) + parseFloat(getComputedStyle(this.window).paddingTop))/2;
        fast.setAttribute("style",`--top: ${top}px; --right: -15px;`);
        hide(fast);
    }

    setTerminal() {
        /**
        * Clear window and generate restart/fast buttons.
        */
        this.generateRestartButton();
        this.generateFastButton();
        this.generateScrollObservers();
        this.setImg();
        this.generateImgMinimiser();
        this.setWindow();
        this.generateSizeObserver();
    }

    setWindow() {
       /**
        * Sets terminal window height
        */
       this.window.style.height = getComputedStyle(this.window).height;
    }

    generateSizeObserver() {
        let observer = new ResizeObserver(entries => {
            entries.forEach(entry => {
                if (entry.contentRect.height) {
                    observer.disconnect();
                    this.setSizes();
                }
            })
        })
        observer.observe(this.window);
    }

    setSizes() {
        // Set restart wrapper
        const windowStyle = getComputedStyle(this.window);
        let top = parseFloat(windowStyle.height) - parseFloat(windowStyle.paddingTop) - parseFloat(windowStyle.paddingBottom);
        this.restartButton.parentElement.setAttribute("style",`--top: ${top}px;`);
        if (this.img) {
            // img-icon wrapper height and top
            let el = this.imgIcon.parentElement;
            let top = parseFloat(windowStyle.height) - parseFloat(windowStyle.paddingTop) - parseFloat(windowStyle.paddingBottom);
            let height = this.window.scrollHeight;
            let right = this.restartButton.offsetWidth + parseFloat(getComputedStyle(this.restartButton).right) + el.offsetWidth;
            el.setAttribute('style', `--height: ${height}px; --top: ${top}px; --right: ${right}px;`);
            // Set img wrapper
            el = this.img.img.parentElement;
            el.setAttribute('style', `max-height: unset; --height: ${this.window.scrollHeight}px`);
        }
    }

    generateImgMinimiser() {
        if (this.img) {
            // Create div  and wrapper for image iconisation with sticky behaviour
            let imgIcon = document.createElement('div');
            hide(imgIcon);
            this.imgIcon = imgIcon;
            imgIcon.innerHTML=`
            <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 524 299" width="2.5em" part="img-icon">
                <title>Click to maximise image</title>
                <style>
                    .s0 {
                        fill: currentColor;
                    } 
                </style>
                <path id="Layer" fill-rule="evenodd" class="s0" d="m53 0h385.6l15 15 55.4 55.4 15 15v183.6c0 16.6-13.4 30-30 30h-441c-16.6 0-30-13.4-30-30v-120h-8c-8.3 0-15-6.7-15-15v-64c0-8.3 6.7-15 15-15h8v-25c0-16.6 13.4-30 30-30zm0 284h441c8.3 0 15-6.7 15-15v-177h-58c-11 0-20-9-20-20v-57h-378c-8.3 0-15 6.7-15 15v25h148c8.3 0 15 6.7 15 15v64c0 8.3-6.7 15-15 15h-148v120c0 8.3 6.7 15 15 15zm59.3-159.7q-0.1-1.5-0.1-2.8 0-6.1-0.1-12.7v-12.7q0-5-0.1-10 0-5 0-10.1 0-0.6-0.1-1.1 0-0.5-0.1-1.2-0.1-0.8-0.5-2-0.3-0.8-1.1-1.5-1-0.9-2.1-1-0.5-0.1-1.1-0.1-0.5-0.1-1.2-0.1-1.5 0-3 1.1-1.3 1-2.6 2.4-1.3 1.5-2.3 3-1 1.6-1.6 2.7-1.6 2.4-2.8 4.3-1.1 1.9-2.2 3.6-1 1.5-1.9 3-0.9 1.3-1.8 2.8-0.2 0.3-0.5 0.9-0.3 0.5-0.8 1.2l-0.7 1q-0.4 0.5-0.6 0.8-1.7-2.3-3.6-5.5-1.8-3.2-4.2-7-0.5-0.9-1.3-2-0.7-1.2-1.5-2.5-0.8-1.3-1.7-2.4-0.8-1.2-1.5-2-1.2-1.3-2.6-3-1.2-1.9-3.1-2.2-0.5-0.1-1.1-0.1-0.6-0.1-1.2-0.1-1.6 0-2.9 0.8-1.2 0.7-2 2.2-0.3 0.8-0.6 1.7-0.2 0.8-0.2 1.8-0.5 7.7-0.5 15.6v12.1l-0.1 14-0.1 7.1v2.4q0.1 1.2 0.2 2.5 0.2 1.1 0.7 2.5 0.6 1.4 1.8 2.1 1.9 1 3.6 0.9 1.6-0.1 2.8-0.9 1.3-0.8 2-2.1 0.7-1.4 0.7-2.9 0.1 0 0.2-2.8 0.1-2.9 0.1-7.2 0.1-4.2 0.1-9.1 0.1-5 0.1-9.3v-7.3q0.1-2.9 0.1-3 2.9 5.5 5.6 9.3 2.8 3.8 5 6.5 0.3 0.6 0.9 1.2l1.3 1.1q0.7 0.5 1.4 0.9 0.7 0.4 1.5 0.3 1.3-0.1 2.4-0.7 1.2-0.8 2.8-2.7 1.6-2 3.9-5.5 2.4-3.6 5.9-9.5 0.2 3 0.1 3.7v3.4q0.1 0.8 0.1 1.6v3.7l0.1 13.9v9.6q0 1.4 0.3 2.6 0.2 1.3 0.8 2.5 0.6 1.1 1.9 1.9 1 0.4 2.2 0.6 1.2 0.2 2.5-0.3 1.3 0 2.3-1 0.8-0.5 1.2-1.6 0.5-1 0.6-2.2 0.2-1.1 0.3-2.2 0.1-1.5 0-2.9zm-83.3 1.1q0 0.9 0 1.6 0.1 0.4 0.1 0.9l0.2 0.9q0 0.5 0.1 1.1 0.1 0.4 0.3 0.9 0.1 0.2 0.2 0.3 0.1 0.1 0.1 0.2 0 0.3 0.3 0.6 0.5 1.1 1.6 1.8 2.2 1 4.6 0.5 1.7-0.3 2.4-1 0.4-0.4 0.7-0.8 0.4-0.4 0.7-0.9 0.1-0.5 0.2-1 0.2-0.5 0.4-1 0.1-0.5 0.1-0.9 0.1-0.4 0.1-0.7v-0.9l0.5-47.1v-2.6q0.1-0.5 0.1-1.1 0-0.6-0.1-1.1 0-0.6-0.1-1.2-0.1-0.5-0.2-1-0.1-0.5-0.3-1.1-0.5-1-1-1.4-0.9-0.9-2.1-1.1-0.6-0.1-1.2-0.1-0.5-0.1-1.3-0.1-1.3 0-2.8 0.7-1.3 0.9-1.9 2.2-0.9 1.9-1 3.5 0 1-0.1 2 0 0.9-0.1 1.8v0.4q-0.2 3.2-0.2 5.7v12.2q0 3.1-0.1 6l-0.1 13.3-0.1 7.2zm143.7-7.8q0.3-2.8 0.3-5.6v-3.7q0-0.4-0.1-1 0-0.6-0.1-1.2-0.1-1-0.4-2-0.2-0.4-0.5-0.8l-0.5-0.7q-0.8-0.6-2.1-0.9-1.3-0.4-2.3-0.3h-9.6q-0.6 0-1.2 0.1-0.7 0.1-1.3 0.3-0.5 0.1-1 0.3-1.2 0.2-1.8 0.7-0.9 1.1-1.2 1.8l-0.1 1.1v1q0 1.4 0.9 2.4 0.8 1.2 2.4 1.8 1.9 0.7 3.9 0.7 0.5 0 1.4 0.1h2.1v0.1q0 1.9-0.4 3.6-0.2 1.7-1.1 3.2-1 1.4-2.5 2.5-1.6 1-4 1.6-1.7 0.5-3.7 0.3-1.9-0.2-3.6-0.8-1.7-0.7-3.2-1.8-1.4-1.2-2.2-2.6-2.1-3.9-3.1-8.4-0.5-2.6-0.7-5.4-0.1-2.9 0.3-5.8 0.3-2.9 1.1-5.5 0.9-2.7 2.4-5 1.3-2 3.2-3.5 2-1.6 4.2-2.3 2.3-0.7 4.6-0.5 2.5 0.2 4.7 1.5 1.9 1.2 2.8 3 0.9 1.7 1.6 3.8 0.5 1.9 2.1 3.2 1.6 1.2 3.3 1.4 1.8 0.2 3.2-0.8 1.5-1.1 2-3.8 0.5-3.1-0.3-6.4-0.8-3.4-2.3-5.7-2.1-3.2-5.7-5.1-3.6-1.9-7.8-2.7-4.1-0.7-8.4-0.2-4.2 0.3-7.7 1.8-3.9 1.5-6.7 4.5-2.7 3-4.6 6.7-1.9 3.8-2.9 7.8-0.9 3.9-1.2 7.4-0.4 5.8 0.3 12.2 0.8 6.4 3.5 11.8 2.7 5.5 7.7 9.2 5.1 3.6 13.3 3.9 1.8 0.1 3.8-0.1 2-0.1 4-0.5 2.1-0.4 3.9-0.9 1.9-0.7 3.3-1.6 2.8-1.7 4.5-4 1.6-2.3 2.4-4.9 0.9-2.6 1.1-5.3zm77.3-10.1c0-13.5 10.8-24.3 24.2-24.3 13.5 0 24.3 10.8 24.3 24.3 0 13.4-10.8 24.2-24.3 24.2-13.4 0-24.2-10.8-24.2-24.2zm195.6 129.1c2 3.4-0.4 7.6-4.3 7.6h-215.6c-3.9 0-6.3-4.2-4.3-7.6l42.6-71.7c2-3.3 6.7-3.3 8.6 0l33.8 56.9 60.9-102.3c1.9-3.2 6.7-3.2 8.6 0z"/>
            </svg>
            `
            imgIcon.classList.add('img-icon');
            let imgIconWrapper = document.createElement('div');
            imgIconWrapper.classList.add('img-icon-wrapper');
            this.window.appendChild(imgIconWrapper);
            imgIconWrapper.appendChild(imgIcon);
            this.img.img.addEventListener("click", this.minimiseImg.bind(this), {passive: true})
            imgIcon.addEventListener("click", this.maximiseImg.bind(this), {passive: true})
        }
    }

    minimiseImg(e) {
        hide(this.img.img);
        show(this.imgIcon, this.abortControllerReset.signal);
    }
    
    maximiseImg(e) {
        show(this.img.img, this.abortControllerReset.signal);
        hide(this.imgIcon);
    }

    setImg() {
        if (this.img) {
            let minWidth = parseFloat(getComputedStyle(this.window).minWidth);
            // Set img sises
            let aspectRatio = this.img.img.width/this.img.img.height;
            let maxHeight = parseFloat(getComputedStyle(this.window).maxHeight) - 25;
            // height
            if (this.img.img.height > maxHeight) {
                this.img.img.width = maxHeight*aspectRatio;
            }
            let observer = new ResizeObserver(entries => {
                entries.forEach(entry => {
                    let width = entry.contentRect.width - 75;
                    // width
                    if (width/aspectRatio <= maxHeight && width >= minWidth) {
                        this.img.img.width = width;
                    }
                    
                })
            })
            observer.observe(this.window);
        }
    }

    hideAll() {
        hide(this.restartButton);
        hide(this.fastButton);
        if (this.img) {
            hide(this.img.img);
            hide(this.imgIcon);
        }
        this.hideLines();
    }   

    showAll() {
        if (this.img) {
            show(this.imgIcon, this.abortControllerReset.signal);
        }
        this.showLines();
    }   

    async initialiseAnimation() {
         /**
         * Start the animation and render the lines
         */
        this.autoScroll();
        await sleep(this.startDelay, this.abortControllerFast.signal);
        show(this.fastButton);
        for (let i=0; i<this.lines.length; i++) {
            let line = this.lines[i];
            //Show image if present 
            if (this.img && this.img.index == i) {
                await this.showImage();
            }
            // Type line
            line.classList.add('isBeingTyped');
            await line.type();
            line.classList.remove('isBeingTyped');
            //Show image if it's at the end
            if (this.img && this.img.index == this.lines.length && i == this.lines.length - 1) {
                await this.showImage();
            }
        }
        hide(this.fastButton);
        if (!this.static) show(this.restartButton, this.abortControllerReset.signal);
    }

    async showImage() {
        if (this.imageTime != 0) {
            await sleep(this.imageDelay, this.abortControllerFast.signal);
            this.maximiseImg();
        }
        if (this.imageTime != 'inf') {
            await sleep(this.imageTime, this.abortControllerFast.signal);
            this.minimiseImg();
        }
    }

    initialise() {
        if (this.init || this.static) {
            this.initialiseAnimation();
        } else {
            this.initialiseWhenVisible();
        }
    }

    initialiseWhenVisible() {
        /**
        * Initialise the terminal only when it becomes visible
        */
        let intersectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    intersectionObserver.disconnect();
                    this.initialiseAnimation();
                }
            })
        },
        {
            threshold: "0.4",
        })
        intersectionObserver.observe(this);
    }

    async scrollToTop() {
    // Scroll to the top of the window.
        this.window.scrollTop = 0;
        return new Promise( async resolve => {
            while (this.window.scrollTop != 0) {
                await sleep(1); //Should find and better way to do this
            }
            resolve();
        })
    }
    
    async scrollToBottom() {
    // Scroll to the bottom of the window.
        let maxHeight = parseFloat(getComputedStyle(this.window).maxHeight);
        await sleep(20); // CHANGE!!!
        this.window.scrollTo(0,this.window.scrollHeight);
        const check = () => this.window.scrollTop == this.window.scrollHeight - maxHeight;
    
        if (check()) {
            return
        } else {                  
            return new Promise(resolve => {
                const timer = setInterval(() => {
                    if (check()) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 10)
            })
        }
    }
    
    scrollOneLine(line) {
        const nPix = parseInt(getComputedStyle(line).height);
        this.window.scrollBy(0,nPix);
    }

    generateScrollObservers() {
        const intersectionFunction = async entry => {
            if (entry.intersectionRatio == 1) {
                intersectionObserver.unobserve(entry.target);
            } else {
                if (entry.target.nextSibling) {
                    this.scrollOneLine(entry.target);
                }
                intersectionObserver.unobserve(entry.target);
            }
        }
           
        let margin = `${parseInt(getComputedStyle(this.window).marginBottom) - 5}px` // Margin of the intersectionObserver computed as bottom margin - 5px (5px padding)
        let intersectionObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                intersectionFunction(entry)
            })
        },
        {
            root: this.window,
            rootMargin: `0px 0px ${margin} 0px`,
        })
        
        const mutationFunction = async entry => {
            let nextSibling = entry.target.nextSibling;
            if (nextSibling) {
                intersectionObserver.observe(nextSibling)
            } else {
                await this.scrollToBottom();
            }
        }

        this.mutationObserverLineBeingTyped = new MutationObserver(entries => {
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
            this.mutationObserverLineBeingTyped.observe(line,{
                attributes: true,
                attributeOldValue: true,
                attributeFilter: ["class"]
            })
        });

        this.addEventListener('wheel', e => {
            this.mutationObserverLineBeingTyped.disconnect();
        }, {passive: true})

        this.addEventListener('keydown', e => {
            if (['ArrowDown','Space','ArrowUp'].includes(e.code)) {
                this.mutationObserverLineBeingTyped.disconnect();
            }
        }, {passive: true})
    }

    applyStatic() {
        let observer = new MutationObserver(entries => {
            entries.forEach(entry => {
                if (entry.target.hasAttribute('static')) {                    
                    this.abortControllerFast.abort();
                    hide(this.restartButton);
                } else {
                    this.restartFunction();
                }
            })
        })
        observer.observe(this, 
            {
            attributes: true,
            attributeFilter: ["static"]
            }
        )
        if (this.static) {
            this.abortControllerFast.abort();
        }
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

 /* terminal-line component */
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
            min-height: 1.5em;
            display: inline;
            align-self: center;
        }
        
        span.directory {
            color: var(--color-text-directory);
        }
        
        span.inputChar {
            color: var(--color-text-inputchar);
        }
        
        [cursor]::after {
            content: attr(cursor);
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
    </style>
    
    <body>
        <div class='terminal-line' part="terminal-line"><slot></slot></div>
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
        this.ALLOWED_NODES = ["span"];
        this.attachShadow({ mode: "open" });
        this.shadowRoot.appendChild(lineTemplate.content.cloneNode(true));
    }

    connectedCallback() {
        this.line = this.shadowRoot.querySelector(".terminal-line");
        this.keepNodes();
        this.generatePS1AndPromptCharElements();
        this.addEventListener('click', e => this.window.focus(), {passive: true})
        this.ready = true;
    }
    
    get window() {
        if (this.parentElement.tagName.toLowerCase() != 'terminal-window') {
            throw new Error("A 'terminal-line' tag can only be placed inside a 'terminal-window' tag.");
        }
        return this.parentElement;
    }

    get data() {
        /**
        * Getter for the data property
        */
        if (this.hasAttribute('data')) {
            let attr = this.getAttribute('data');
            if (this.window.DATA_TYPES.includes(attr)) {
                return attr;
            } else {
                return 'output';
            }
        } else {
            return this.window.data;
        }
    }
    
    get lineDelay() {
        /**
        * Resets lineDelay property.
        */
        if (this.hasAttribute('lineDelay')) {
            return parseFloat(this.getAttribute('lineDelay'));
        } else if (this.window.hasAttribute('lineDelay')) {
            return parseFloat(this.window.getAttribute('lineDelay'));
        } else if (["input","prompt"].includes(this.data)) {
            return 600;
        } else {
            return 100;
        }
    }
    
    get typingDelay() {
        /**
        * Resets typingDelay property.
        */
        if (this.hasAttribute('typingDelay')) {
            return parseFloat(this.getAttribute('typingDelay'));
        } else if (this.window.hasAttribute('typingDelay')) {
            return parseFloat(this.window.getAttribute('typingDelay'));
        } else if (["progress"].includes(this.data)) {
            return 30;
        } else {
            return 80;
        }
    }
    
    get progressChar() {
        /**
        * Getter for the progressChar property
        */
        return replaceTagSymbols(this.getAttribute('progressChar')?.toString()) || this.window.progressChar;
    }
    
    get progressPercent() {
        /**
        * Getter for the progressPercent property
        */
        return parseFloat(this.getAttribute('progressPercent')) || this.window.progressPercent;
    }
    
    get cursor() {
        /**
        * Getter for the cursor property
        */
        return replaceTagSymbols(this.getAttribute('cursor')?.toString()) || this.window.cursor;
    }
    
    get inputChar() {
        /**
        * Getter for the inputChar property
        */
        if (this.hasAttribute('PS1')) {
            return '';
        } else {
            return replaceTagSymbols(this.getAttribute('inputChar')?.toString()) || this.window.inputChar;
        }
    }
    
    get promptChar() {
        /**
        * Getter for the promptChar property
        */
        return replaceTagSymbols(this.getAttribute('promptChar')?.toString()) || this.window.promptChar;
    }
    
    get directory() {
        /**
        * Getter for the directory property
        */
        if (this.hasAttribute('PS1')) {
            return '';
        } else {
            return replaceTagSymbols(this.getAttribute('directory')?.toString()) || this.window.directory;
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
            return this.window.PS1;
        }
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
        this.nodesNotHidden = this.nodes.filter(node => getComputedStyle(node).display != 'none');
    }

    showPS1() {
        show(this.shadowRoot.querySelector('.ps1'), this.window.abortControllerReset.signal);
    }
    
    showPromptChar() {
        show(this.shadowRoot.querySelector('.promptChar'), this.window.abortControllerReset.signal);
    }

    async type() {
        /**
        * Function that handles the animation of the current line based on its data property
        */
        if (this.data == 'input') {
            this.showPS1();
            await this.typeInput();
        } else if (this.data == 'progress') {
            await sleep(this.lineDelay, this.window.abortControllerFast.signal);
            await this.typeProgress();
            return;
        } else if (this.data == 'prompt') {
            this.showPromptChar();
            await this.typeInput();
        } else {
            await sleep(this.lineDelay, this.window.abortControllerFast.signal);
            show(this, this.window.abortControllerReset.signal)
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
        show(this, this.window.abortControllerReset.signal);
        for (let i=1; i<=progressSteps; i++) {
            await sleep(this.typingDelay, this.window.abortControllerFast.signal);
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
        show(this, this.window.abortControllerReset.signal);
        this.addCursor();
        await sleep(this.lineDelay, this.window.abortControllerFast.signal);
        for (let i=0; i<this.nodesNotHidden.length; i++) {
            let node = this.nodesNotHidden[i];
            let text = textArray[i];
            for (let char of text) {
                await sleep(this.typingDelay, this.window.abortControllerFast.signal);
                node.textContent += char;
            }
        }
        this.removeCursor();
    }

    getAndRemoveTextContent() {
        let textArray = [];
        for (let node of this.nodesNotHidden) {
            textArray.push(node.textContent);
            node.textContent = "";
        }
        return textArray;
    }

    addCursor() {
        this.line.setAttribute("cursor", `${this.cursor}`)
    }
    
    removeCursor() {
        this.line.removeAttribute('cursor');
    }

    generatePS1AndPromptCharElements() {
        let elem = document.createElement('div');
        elem.style.display="inline";
        if (this.data == 'input') {
            elem.innerHTML = this.PS1;
            elem.classList.add('ps1');
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

customElements.define("terminal-window", TerminalWindow)
customElements.define("terminal-line", TerminalLine)
