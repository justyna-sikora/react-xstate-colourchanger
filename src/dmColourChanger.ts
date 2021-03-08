import { MachineConfig, send, Action, actions } from "xstate";
const { cancel } = actions;

// SRGS parser and example (logs the results to console on page load)
import { loadGrammar } from './runparser'
import { parse } from './chartparser'
import { grammar } from './grammars/thinkersGrammar'
//import { cancel } from "xstate/lib/actionTypes";

const gram = loadGrammar(grammar)
const input = "do be do be do"
const prs = parse(input.split(/\s+/), gram)
const result = prs.resultsForRule(gram.$root)[0]

console.log(result)

const sayColour: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `Repainting to ${context.recResult}`
}))


function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function promptAndAsk(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: say(prompt),
                on: { ENDSPEECH: 'ask' }
            },
            ask: {
                entry: [send('LISTEN'), 
                send ('MAXSPEECH', {
                      delay: 5000  ,
                    id: 'maxsp'})],
            },
        }
    })
}

const commands = {"stop": "S", "help": "H"}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'askColourAndShape'
            }
        },
        askColourAndShape: {
            initial: 'colour',
            on: {RECOGNISED: 
                    { target: 'stop', 
                    actions: cancel('maxsp'),
                    cond: (context) => context.recResult === 'stop'
                },
                MAXSPEECH: 'maxspeech'
            },
            states: {
                hist: { type: "history" },
                colour: {
                    on: {
                        RECOGNISED: [
                            {target: 'shape',
                            actions: cancel('maxsp'),
                            cond: (context) => !(context.recResult === 'stop')}]
                    },
                         
                    ...promptAndAsk("Tell me the colour")
                },
                shape: {
                    id: 'shapee',
                    on: {
                        RECOGNISED: [
                            {target: '#root.dm.repaint',
                            actions: cancel('maxsp'),
                            cond: (context) => !(context.recResult === 'stop')}]
                    },
                    ...promptAndAsk("Tell me the shape")
                }}
            },

        maxspeech: {
            entry: say("Sorry"),
            on: { 'ENDSPEECH': 'askColourAndShape.hist' }
        },
        stop: {
            entry: say("Ok"),
            always: 'init'
        },
        repaint: {
            initial: 'prompt',
            states: {
                prompt: {
                    entry: sayColour,
                    on: { ENDSPEECH: 'repaint' }
                },
                repaint: {
                    entry: 'changeColour',
                    always: '#root.dm.askColourAndShape'
                }
            }
        }
    }
})