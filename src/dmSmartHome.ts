import { MachineConfig, send, Action, actions, assign } from "xstate";
const { cancel } = actions;

// SRGS parser and example (logs the results to console on page load)
import { loadGrammar } from './runparser'
import { parse } from './chartparser'
import { grammar } from './grammars/homeGrammar'
//import { cancel } from "xstate/lib/actionTypes";

const gram = loadGrammar(grammar)
const input = "Please close window"
const prs = parse(input.split(/\s+/), gram)
const result = parse((input).split(/\s+/), gram).resultsForRule(gram.$root)[0]

//console.log((result['todo']["object"]))
//console.log((result['todo']["action"]))
console.log(result)
//console.log(gram)

const sayColour: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `Repainting to ${context.recResult}`
}))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}


export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'who'
            }
        },
        who: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => (parse(context.recResult.split(/\s+/), gram).resultsForRule(gram.$root)[0]),
                    actions: [assign((context) => { return { object: (parse(context.recResult.split(/\s+/), gram).resultsForRule(gram.$root)[0])['todo']["object"] } },
                    ),
                    assign((context) => { return { action: (parse(context.recResult.split(/\s+/), gram).resultsForRule(gram.$root)[0])['todo']["action"] } },
                    )],
                    
                    target: "ok"

                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: say("What do you want to do?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I don't understand"),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },
        ok: {
            initial: "prompt",
            on: { ENDSPEECH: "init" },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.object} ${context.action}.`
                    }))
                },
            }
        }
    }
})