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
 *      <terminal-line type="input">First input line</terminal-line>
 *      <terminal-line type="input">Second input line</terminal-line>
 *      <terminal-line>First output line</terminal-line>
 * </terminal-animation>
 * 
 * The animation starts only when the terminal becomes visible (with a certain threshold), unless the 'init'
 * attribute is present (in that case the animation starts right after the page loads).
 * To know all the other possible attributes and what they do please read the specific components.
*/


'use strict';

const terminalTemplate = document.createElement("template");
terminalTemplate.innerHTML = `
    <style>
        div.terminal-container {
            max-width: 100%;
            margin: 20px 20px 20px 20px;
            background: #252a33;
            color: #eee;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            font-size: 13px;
            font-family: 'Roboto Mono', 'Fira Mono', Consolas, Menlo, Monaco, 'Courier New', Courier, monospace;
            font-weight: bold;
            border-radius: 4px;
            padding: 35px 25px 20px;
            position: relative;
            -webkit-box-sizing: border-box;
                    box-sizing: border-box;
        }

        div.terminal-container::before {
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
        
        .restart-button {
            position: absolute;
            text-decoration: none;
            bottom: 7px;
            right: 7px;
            color: #115D97;
        }
        
        .restart-button:hover {
            color: #FAA619;
        }

        .fast-button {
            position: absolute;
            text-decoration: none;
            top: 7px;
            right: 7px;
            color: #115D97;
        }
        
        .fast-button:hover {
            color: #FAA619;
        }

    </style>
    
    <div class='terminal-container'>
        <slot></slot>
    </div>
`

/* Terminal component */
class TerminalAnimation extends HTMLElement {
    /**
     * Custom attributes for the <terminal-animation> component:
     * * @param {string} data - Type of prompt for each line of the entire terminal. Choices can be:
    //  *   - 'output': Output of the terminal. Written all at once; (default)
    //  *   - 'input': Input to the terminal. Written with typing animation after 'directory' and 'inputChar' attributes;
    //  *   - 'prompt': Same as input, but with written with typing animation after 'promptChar' attribute;
    //  *   - 'progress' Line with progress bar animation.
    //  * @param {number || string} startDelay - Delay before the start of terminal animation, in ms.
    //  * @param {number || string} lineDelay - Delay before the start of each terminal line animation, in ms.
    //  * @param {number || string} typingDelay - Delay between each typed character in the terminal, in ms.
    //  * @param {number || string} progressLength - Number of characters displayed as progress bar for the entire terminal.
    //  * @param {string} progressChar – Character(s) to use for progress bar for the entire terminal, defaults to █.
	//  * @param {number || string} progressPercent - Max percent of progress for the entire terminal, default 100%.
    //  * @param {string} cursor – Character to use for cursor for the entire terminal, defaults to ▋.
    //  * @param {string} inputChar – Character(s) to use before the 'input' prompt for the entire terminal, defaults to '$'.
    //  * @param {string} promptChar – Character(s) to use before the 'prompt' prompt for the entire terminal, defaults to '>>>'.
    //  * @param {string} directory – If present, directory to write before the input character for the entire terminal.
    //  * @param {boolean} init - Initialise the terminal animation at page load.
    //  * @param {boolean} static - Create a static terminal without animation.
    //  */
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.append(terminalTemplate.content.cloneNode(true));
        this.DATA_TYPES = ['output','input','prompt','progress'];
        this.container = shadow.querySelector(".terminal-container");        
        this.startDelayOriginal = this.startDelay =
            parseFloat(this.getAttribute('startDelay')) || 500;
        this.lineDelayOriginal = this.lineDelay =
            parseFloat(this.getAttribute('lineDelay')) || 1000;
        this.typingDelayOriginal = this.typingDelay =
            parseFloat(this.getAttribute('typingDelay')) || 80;
        this.progressLength = parseFloat(this.getAttribute('progressLength')) || 40;
        this.progressChar = this.getAttribute('progressChar')?.toString() || '█';
        this.progressPercent = parseFloat(this.getAttribute('progressPercent')) || 100;
        this.cursor = this.getAttribute('cursor')?.toString() || '▋';
        this.inputChar = this.getAttribute('inputChar')?.toString() || '$';
        this.promptChar = this.getAttribute('promptChar')?.toString() || '>>>';
        this.directory = this.getAttribute('directory')?.toString() || '';
        // this.data = this.DATA_TYPES.includes(this.getAttribute('data')) ? this.getAttribute('data') : 'output';
        this.keepLines(["terminal-line","img"]);
        if (!this.hasAttribute('static')) {
            this.setTerminal();
            if (this.hasAttribute('init')) {
                this.init();
            }
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

    keepLines(elementList) {
        /**
        * Delete all terminal lines without tags or whose tags are not within the elementList
        * and make the array 'this.lines' with the kept ones.
        */
        for (let i=0; i<this.childNodes.length; i++) {
            let node = this.childNodes[i];
            if (!elementList.includes(node.tagName?.toLowerCase())) {
                node.remove();
                i--;
            }
        }
        this.lines = this.childNodes;
    }

    hide(element) {
        /**
        * Change element's style to 'hidden'
        */
        element.style.visibility = 'hidden';
    }
    
    show(element) {
        /**
        * Change element's style to 'visible'
        */
        element.style.visibility = 'visible';
    }

    sleep(time) {
        /**
        * Sleep for an amount of time
        */
        return new Promise(resolve => setTimeout(resolve, time));
    }
    
    hideLines() {
        /**
        * Hide lines inside the terminal
        */
        this.lines.forEach(line => this.hide(line));

        // this.insertCharBeforeInput();
    }

    generateRestartButton() {
        /**
        * Generate restart button and adds it hidden to 'this.container'
        */
        const restart = document.createElement('a')
        restart.onclick = e => {
            e.preventDefault();
            this.init();
        }
        restart.href = '';
        restart.classList.add('restart-button');
        restart.innerHTML = "restart ↻";
        this.restartButton = restart;
        this.hide(restart);
        this.container.appendChild(restart);
    }

    generateFastButton() {
        /**
        * Generate fast button and adds it hidden to 'this.container'
        */
        const fast = document.createElement('a')
        fast.onclick = (e) => {
            e.preventDefault();
            this.lineDelay = 0;
            this.typeDelay = 0;
            this.startDelay = 0;
        }
        fast.href = '';
        fast.classList.add('fast-button');
        fast.innerHTML = "fast ❯❯❯";
        this.hide(fast);
        this.fastButton = fast;
        this.container.appendChild(fast);
    }

    setTerminal() {
        /**
        * Clear container and generate restart/fast buttons.
        */
        this.hideLines();
        this.generateRestartButton();
        this.generateFastButton();
    }

    async init() {
         /**
         * Start the animation and render the lines
         */
        this.hideLines();
        this.show(this.fastButton);
        await this.sleep(this.startDelay);
        for (let line of this.lines) {
            if (line.tagName.toLowerCase() == 'terminal-line') {
                // Handle <terminal-line> lines
                continue;
            } else if (line.tagName.toLowerCase() == 'img') {
                // Handle <img> lines
                continue;
            }
        }
    }
        //     const lineDelay = line.getAttribute('lineDelay') || this.lineDelay;

        //     if (type == 'input') {
        //         line.setAttribute('cursor', this.cursor);
        //         await this.typeAnimation(line);
        //         await this.sleep(lineDelay);
        //     }

        //     else if (type == 'progress') {
        //         await this.progress(line);
        //         await this.sleep(lineDelay);
                
        //     }

        //     else {
        //         this.container.appendChild(line);
        //         await this.sleep(lineDelay);
        //     }

        //     line.removeAttribute('cursor');
        // }
        // this.fastElement.style.visibility = 'hidden'
        // this.lineDelay = this.originalLineDelay
        // this.typeDelay = this.originalTypeDelay
        // this.startDelay = this.originalStartDelay
        // this.addRestart()
}




//     /**
//      * Animate a typed line.
//      * @param {Node} line - The line element to render.
//      */
//     async typeAnimation(line) {
//         function getAndRemoveAllText(element) {
//             let textArray = [];
//             // loop through all the nodes of the element
//             for (let node of element.childNodes) {
//                 if (node.nodeType == Node.ELEMENT_NODE && node.hasAttribute("charBeforeInput")) {
//                     textArray.push("");
//                     continue;
//                 }
//                 textArray.push(node.textContent);
//                 node.textContent = "";
//             }
//             return textArray;
//         }
        
//         const delay = line.getAttribute('typeDelay') || this.typeDelay;
//         let textArray = getAndRemoveAllText(line);
//         this.container.appendChild(line);
//         for (let i=0; i<line.childNodes.length; i++) {
//             let node = line.childNodes[i];
//             if (node.nodeType == Node.ELEMENT_NODE && node.hasAttribute("charBeforeInput")) {continue};
//             let text = textArray[i];
//             for (let char of text) {
//                 await this.sleep(delay)
//                 node.textContent += char;
//             }
//         }
//     }

//     /**
//      * Animate a progress bar.
//      * @param {Node} line - The line element to render.
//      */
//     async progress(line) {
//         const progressLength = line.getAttribute('progressLength')
//             || this.progressLength;
//         const progressChar = line.getAttribute('progressChar')
//             || this.progressChar;
//         const chars = progressChar.repeat(progressLength);
// 		const progressPercent = line.getAttribute('progressPercent')
// 			|| this.progressPercent;
//         line.textContent = '';
//         this.container.appendChild(line);

//         for (let i = 1; i < chars.length + 1; i++) {
//             await this.sleep(this.typeDelay);
//             const percent = Math.round(i / chars.length * 100);
//             line.textContent = `${chars.slice(0, i)} ${percent}%`;
// 			if (percent>progressPercent) {
// 				break;
// 			}
//         }
//     }

//     /**
//      * Helper function for animation delays, called with `await`.
//      * @param {number} time - Timeout, in ms.
//      */
//     sleep(time) {
//         return new Promise(resolve => setTimeout(resolve, time));
//     }

//     insertCharBeforeInput(selector='[data-ty="input"]') {
//         this.container.querySelectorAll(selector).forEach(node => {
//             node.insertAdjacentHTML("afterbegin",`<span charBeforeInput>${this.charBeforeInput} </span>`)
//         })
//     }
// }

// function startVisibleTerminals(termynals) {
//     const observer = new IntersectionObserver(entries => {
//         entries.forEach(entry => {
//             const visibleTermynal = termynals.find( termynal => {
//                 return termynal.container === entry.target
//             })
//             if (entry.isIntersecting) {
//                 visibleTermynal.init();
//                 observer.unobserve(entry.target);
//             }
//         })
//     },
//     {
//         rootMargin: "-50px",
//     })
//     termynals.forEach(termynal => observer.observe(termynal.container));
// }

// function main() {
//     const terms=createNotInitialisedTermynals();
//     startVisibleTerminals(terms);
// }

// main()
// // References:
// // https://github.com/tiangolo/fastapi/blob/master/docs/en/docs/js/termynal.js

const lineTemplate = document.createElement("template");
lineTemplate.innerHTML = `
    <style>

        slot {
            line-height: 2;
            // display: flex;
            // justify-self: center;
            // align-self: flex-end;
        }

        // [data]::before {
        //     /* Set up defaults and ensure empty lines are displayed. */
        //     content: '';
        //     display: inline-block;
        // }

        // [data][prompt]::before {
        //     content: attr(prompt);
        //     color: var(--color-text-subtle);
        // }

        // [data="input"][directory]::before {
        //     content: attr(directory);
        //     color: var(--color-text-directory);
        // }
        
    </style>
    
    <slot></slot>
`

/* Terminal line */
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
    //  * @param {number} progressLength - Number of characters displayed as progress bar in the line.
    //  * @param {string} progressChar – Character to use for progress bar in the line, defaults to █.
	//  * @param {number} progressPercent - Max percent of progress in the line, default 100%.
    //  * @param {string} cursor – Character to use for cursor in the line, defaults to ▋.
    //  * @param {string} inputChar – Character(s) to use before the 'input' prompt in the line, defaults to '$'.
    //  * @param {string} promptChar – Character(s) to use before the 'prompt' prompt in the line, defaults to '>>>'.
    //  * @param {string} directory – If present, directory to write before the input character in the line.
    //  */
    constructor() {
        super();
        const shadow = this.attachShadow({ mode: "open" });
        shadow.append(lineTemplate.content.cloneNode(true));
        this.container = this.parentElement;
    
        this.lineDelayOriginal = this.lineDelay = 
            parseFloat(this.getAttribute('lineDelay')) || this.container.lineDelay;
        this.typingDelayOriginal = this.typingDelay = 
            parseFloat(this.getAttribute('typingDelay')) || this.container.typingDelay;
        this.progressLength = parseFloat(this.getAttribute('progressLength')) || this.container.progressLength;
        this.progressChar = this.getAttribute('progressChar')?.toString() || this.container.progressChar;
        this.progressPercent = parseFloat(this.getAttribute('progressPercent')) || this.container.progressPercent;
        this.cursor = this.getAttribute('cursor')?.toString() || this.container.cursor;
        this.inputChar = this.getAttribute('inputChar')?.toString() || this.container.inputChar;
        this.promptChar = this.getAttribute('promptChar')?.toString() || this.container.promptChar;
        this.directory = this.getAttribute('directory')?.toString() || this.container.directory;
        // this.data = this.DATA_TYPES.includes(this.getAttribute('data')) ? this.getAttribute('data') : this.container.data;
        console.log()
    }
}

customElements.define("terminal-animation", TerminalAnimation)
customElements.define("terminal-line", TerminalLine)