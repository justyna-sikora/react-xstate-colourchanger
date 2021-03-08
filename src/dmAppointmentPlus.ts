import { MachineConfig, send, Action, assign, actions } from "xstate";
import { mapContext } from "xstate/lib/utils";
//import { cancel } from "xstate/lib/actionTypes";
const { cancel } = actions;

const proxyurl = "https://cors-anywhere.herokuapp.com/";
const rasaurl = 'https://assignment2nlu.herokuapp.com/model/parse'
const nluRequest = (text: string) =>
    fetch(new Request(proxyurl + rasaurl, {
        method: 'POST',
        headers: { 'Origin': 'http://localhost:3000/react-xstate-colourchanger' }, // only required with proxy
        body: `{"text": "${text}"}`
    }))
        .then(data => data.json());



function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}


function listen(): Action<SDSContext, SDSEvent> {
    return send('LISTEN')
}

const grammar: { [index: string]: { person?: string, day?: string, time?: string } } = {
    "John": { person: "John Appleseed" },
    "Ridley": { person: "Ridley Scott" },
    "Steven": { person: "Steven Spielberg" },
    "Wes": { person: "Wes Andreson" },
    "Stanley": { person: "Stanley Kubrick" },
    "David": { person: "David Lynch" },
    "Ingmar": { person: "Ingmar Bergman" },
    "Alfred": { person: "Alfred Hitchcock "},
    "Tim": { person: "Tim Burton" },

    "on Friday": { day: "Friday" },
    "on Monday": { day: "Monday" },
    "Monday": { day: "Monday"},
    "Friday": { day: "Friday" },
    "Tuesday": { day: "Tuesday" },
    "Thursday": { day: "Thursday" },
    "on Tuesday": { day: "Tuesday" },
    "on Wednesday": { day: "Wednesday" },
    "Wednesday": { day: "Wednesday" },
    "on Thursday": { day: "Thursday" },
    "on Saturday": { day: "Saturday" },
    "Saturday": { day: "Saturday" },
    "on Sunday": { day: "Sunday" },
    "Sunday": { day: "Sunday" },

    "6": { time: "6:00" },
    "at 6": { time: "6:00" },
    "7": { time: "7:00" },
    "at 7": { time: "7:00" },
    "8": { time: "8:00" },
    "at 8": { time: "8:00" },
    "9": { time: "9:00" },
    "at 9": { time: "9:00" },
    "10": { time: "10:00" },
    "at 10": { time: "10:00" },
    "11": { time: "11:00" },
    "at 11": { time: "11:00" },
    "12": { time: "12:00" },
    "at 12": { time: "12:00" },
    "13": { time: "1:00 pm" },
    "at 13": { time: "1:00 pm" },
    "14": { time: "2:00 pm" },
    "at 14": { time: "2:00 pm" },
    "15": { time: "3:00 pm" },
    "at 15": { time: "3:00 pm" },
    "16": { time: "4:00 pm" },
    "at 16": { time: "4:00 pm" },
    
}

const boolGrammar = {
      "yes": true,
      "of course": true,
      "yep": true,
      "sure": true,
      "that's right": true,
      "nope": false,
      "no": false,
      "no way": false,
      "never": false,
}



function promptAndAsk(prompt: Action<SDSContext, SDSEvent>): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: prompt,
                on: {  ENDSPEECH:  [{
                    target: "ask",
                    actions: assign((context) => { return {count: context.count + 1 }})
                    },
                    ]}
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



const commands = {"help": "H"}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'ask'
            }
        }, 
        help: {
            entry: say("It seems that you need some help. Let's try again."),
            always:[{target: 'ask.hist', actions: assign((context) => { return {count: (context.count - 1) }}) }] },

        maxspeech1: {
            entry: say("Sorry"),
            on: { 'ENDSPEECH': 'ask.hist' },  

        },
        ask: {
        initial: 'welcome',
            on: {RECOGNISED: 
                    { target: 'help', 
                    cond: (context) => context.recResult === 'help' },},
            states: {
                hist: { type: "history" },
                welcome: {
                    entry: assign((context) => { return {count: 0 }}),
                    id: "wlcm",
                    initial: "prompt",
                    on: { RECOGNISED: 
                            { target: 'query',
                            cond: (context) => !(context.recResult === 'help'),
                            actions: [cancel('maxsp'), assign((context) => { return {count: 0 }}), assign((context) => { return { query: context.recResult } })],
                            },
                        MAXSPEECH: '#root.dm.maxspeech1'
                    },
                    states: {
                        prompt: {
                                ...promptAndAsk(send((context) => ({
                                    type: "SPEAK",
                                    value: `What would you like to do?`})))
                            ,
                            on: { ENDSPEECH: {actions: assign((context) => { return {count: 0 }})} }
                        },
                        
                          
                        }
            },
            query: {
                invoke: {
                    id: 'rasa',
                    src: (context, event) => nluRequest(context.query),
                    onDone: {
                        target: 'menu',
                        cond: (context) => !(context.recResult === 'help'),
                        actions: [assign((context, event) => { return {intentbest: event.data }}),
                                (context:SDSContext, event:any) => console.log(event.data), cancel('maxsp')]
                    },
                    onError: {
                        target: '#wlcm',
                        cond: (context) => !(context.recResult === 'help'),
                        actions: (context,event) => console.log(event.data)
                         }
                    }
            },
	        menu: {
                initial: "prompt",
                on: {
                    ENDSPEECH: [{
                    cond: (context) => context.intentbest.intent.name === "timer",
                    target: "Timer"
                    },
                    {cond: (context) => context.intentbest.intent.name === "todo_item",
                    target: "TODOitem"
                    },
                    {cond: (context) => context.intentbest.intent.name === "appointment",
                    target: "Appointment"
                    },
                    { target: ".nomatch",
                    cond: (context) => !(context.recResult === 'help')}]
                },
                states: {
                    prompt: {
                        entry: send((context) => ({
                            type: "SPEAK",
                            value: `OK, noted!`
                        }))
                    },
                    nomatch: {entry: say("Oh sorry, I can't help you with that at the moment. Let's start over"),
                        on: { ENDSPEECH: "#wlcm" }
                        },
                    }
            },
            TODOitem: {
                initial: "prompt",
                on: { ENDSPEECH: "#root.dm.init" },
                states: {
                    prompt: { entry: say("Welcome to the To do item app")
                    }
                }
            },
            Timer: {
                initial: "prompt",
                on: { ENDSPEECH: "#root.dm.init" },
                states: {
                    prompt: { entry: say ("Welcome to the Timer app")
                    }
                }
            },
            Appointment: {
                initial: "prompt",
                on: { ENDSPEECH: "#who" },
                states: {
                    prompt: { entry: say("Let's create an appointment") 
                    }
                }
            },
            who: {
                id: 'who',
                initial: "prompt",
                on: {
                    RECOGNISED: [{
                        cond: (context) => "person" in (grammar[context.recResult] || {}),
                        actions: [cancel('maxsp'), assign((context) => { return {count: 0 }}), assign((context) => { return { person: grammar[context.recResult].person } })],
                        target: "day"},
                        { target: ".maxspeech",
                        actions: cancel('maxsp'),
                        cond: (context) => !(context.recResult === 'help') }],
                    MAXSPEECH: '.maxspeech'
                        },
                states: {
                        prompt: {...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Who are you meeting with?`})))
                        },
                        prompt1: {
                            ...promptAndAsk(send((context) => ({
                                type: "SPEAK",
                                value: `Who is is that you are meeting?`})))
                        },
                        prompt2: {
                            ...promptAndAsk(send((context) => ({
                                type: "SPEAK",
                                value: `Did you want to meet with someone?`})))
                        },
                        prompt3: {
                            ...promptAndAsk(send((context) => ({
                                type: "SPEAK",
                                value: `Ok, last chance. Who are you meeting with?`})))
                        },
                        maxspeech: {
                            entry: say("Sorry"),
                            on: { ENDSPEECH : [{
                                cond: (context) => context.count === 0,
                                target: "prompt"},
                                {
                                cond: (context) => context.count === 1,
                                target: "prompt1"},
                
                                { target: "prompt2",
                                cond: (context) => context.count === 2},
                
                                { target: "prompt3",
                                cond: (context) => context.count === 3},
                            
                                { target: "#root.dm.init",
                                cond: (context) => context.count === 4},
                                
                            ]}
                        },
                        
                    }
            },
            day: {
                initial: "prompt",
                on:{ 
                    RECOGNISED: [{
                        cond: (context) => "day" in (grammar[context.recResult] || {}),
                        actions: [cancel('maxsp'), assign((context) => { return {count: 0 }}), assign((context) => { return { day: grammar[context.recResult].day } })],
                        target: "duration"
                        },
                        { target: ".maxspeech",
                        actions: cancel('maxsp'),
                        cond: (context) => !(context.recResult === 'help') }],
                    MAXSPEECH: '.maxspeech'
                },
                states: {
                        prompt: {...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Ok, ${context.person}. What time is your meeting?`})))
                        },
                        prompt1: {
                            ...promptAndAsk(send((context) => ({
                                type: "SPEAK",
                                value: `When do you want to create a meeting with ${context.person}?`})))
                        },
                        prompt2: {
                            ...promptAndAsk(send((context) => ({
                                type: "SPEAK",
                                value: `On which day is your appointment with ${context.person}?`})))
                        },
                        prompt3: {
                            ...promptAndAsk(send((context) => ({
                                type: "SPEAK",
                                value: `Ok, last chance. On which day is your meeting with ${context.person}?`})))
                        },
                    
                        maxspeech: {
                            entry: say("Sorry"),
                            on: { ENDSPEECH : [{
                                cond: (context) => context.count === 0,
                                target: "prompt"},
                                {
                                cond: (context) => context.count === 1,
                                target: "prompt1"},
                
                                { target: "prompt2",
                                cond: (context) => context.count === 2},
                
                                { target: "prompt3",
                                cond: (context) => context.count === 3},
                            
                                { target: "#root.dm.init",
                                cond: (context) => context.count === 4},
                                
                            ]}
                        },
                    }
            },
            duration: {
                initial: "prompt",
                on: {
                    RECOGNISED: [{cond: (context) => (boolGrammar[context.recResult] === false),
                        target: "time",
                        actions: [cancel('maxsp'),assign((context) => { return {count: 0 }}),]
                        },
                        {cond: (context) => (boolGrammar[context.recResult] === true),
                        target: "confirm_meeting_whole_day",
                        actions: [cancel('maxsp'), assign((context) => { return {count: 0 }}),]
                        },
                        { target: ".maxspeech",
                        actions: cancel('maxsp'),
                        cond: (context) => !(context.recResult === 'help') }],
                    MAXSPEECH: '.maxspeech'
                },
                states: {
                    prompt: {...promptAndAsk(send((context) => ({
                        type: "SPEAK",
                        value: `Ok, ${context.person} on ${context.day},  will it take the whole day?`})))
                    },
                    prompt1: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Will your meeting take the whole day?`})))
                    },
                    prompt2: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Do you think your meeting will last the whole day?`})))
                    },
                    prompt3: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Ok, last chance. Will your meeting with ${context.person} on ${context.day} take the whole day?`})))
                    },
                    maxspeech: {
                        entry: say("Sorry"),
                        on: { ENDSPEECH : [{
                            cond: (context) => context.count === 0,
                            target: "prompt"},
                            {
                            cond: (context) => context.count === 1,
                            target: "prompt1"},
            
                            { target: "prompt2",
                            cond: (context) => context.count === 2},
            
                            { target: "prompt3",
                            cond: (context) => context.count === 3},
                        
                            { target: "#root.dm.init",
                            cond: (context) => context.count === 4},
                            
                        ]}
                    },
                }
            },
	        time: {
                initial: "prompt",
                on: { RECOGNISED: [{
                        cond: (context) => "time" in (grammar[context.recResult] || {}),
                        actions: [cancel('maxsp'), assign((context) => { return {count: 0 }}), assign((context) => { return { time: grammar[context.recResult].time } })],
                        target: "confirm_time"
                        },
                        { target: ".maxspeech",
                        actions: cancel('maxsp'),
                        cond: (context) => !(context.recResult === 'help') }],
                    MAXSPEECH: '.maxspeech'
                },
                states: {
                    prompt: {...promptAndAsk(send((context) => ({
                        type: "SPEAK",
                        value: `What time is yout meeting?`})))
                    },
                    prompt1: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `When exactly do you want to create an appointment?`})))
                    },
                    prompt2: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `When does your meeting start?`})))
                    },
                    prompt3: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Ok, last chance. What time is your meeting`})))
                        
                    },
                    maxspeech: {
                        entry: say("Sorry"),
                        on: { ENDSPEECH : [{
                            cond: (context) => context.count === 0,
                            target: "prompt"},
                            {
                            cond: (context) => context.count === 1,
                            target: "prompt1"},
            
                            { target: "prompt2",
                            cond: (context) => context.count === 2},
            
                            { target: "prompt3",
                            cond: (context) => context.count === 3},
                        
                            { target: "#root.dm.init",
                            cond: (context) => context.count === 4},
                            
                        ]}
                    },
                }
            },
	        confirm_meeting_whole_day: {
                initial: "prompt",
                on: {
                    RECOGNISED: [{cond: (context) => (boolGrammar[context.recResult] === false),
                        target: "#root.dm.init",
                        actions: cancel('maxsp')
                        },
                        {cond: (context) => (boolGrammar[context.recResult] === true),
                        target: "#confirmed",
                        actions: cancel('maxsp')
                        },
                        { target: ".maxspeech",
                        actions: cancel('maxsp'),
                        cond: (context) => !(context.recResult === 'help') }],
                    MAXSPEECH: '.maxspeech'
                },
                states: {
                    prompt: {...promptAndAsk(send((context) => ({
                        type: "SPEAK",
                        value: `Do you want to create an appointment with ${context.person} on ${context.day} for the whole day?`})))
                    },
                    prompt1: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Are your sure you want to create this meeting?`})))
                    },
                    prompt2: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Do you want me to create this appointment?`})))
                    },
                    prompt3: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Ok, last chance. Do you want to create an appointment with ${context.person} on ${context.day} for the whole day?`})))
                    },
                    maxspeech: {
                        entry: say("Sorry"),
                        on: { ENDSPEECH : [{
                            cond: (context) => context.count === 0,
                            target: "prompt"},
                            {
                            cond: (context) => context.count === 1,
                            target: "prompt1"},
            
                            { target: "prompt2",
                            cond: (context) => context.count === 2},
            
                            { target: "prompt3",
                            cond: (context) => context.count === 3},
                        
                            { target: "#root.dm.init",
                            cond: (context) => context.count === 4},   
                        ]}
                    },
                }
            },
 	        confirm_time: {
                initial: "prompt",
                on:  {
                    RECOGNISED: [{cond: (context) => (boolGrammar[context.recResult] === false),
                        target: "who",
                        actions: cancel('maxsp')
                        },
                        {cond: (context) => (boolGrammar[context.recResult] === true),
                        target: "#confirmed",
                        actions: cancel('maxsp')
                        },
                        { target: ".maxspeech",
                        actions: cancel('maxsp'),
                        cond: (context) => !(context.recResult === 'help') }],
                    MAXSPEECH: '.maxspeech'
                },
                states: {
                    prompt: {...promptAndAsk(send((context) => ({
                        type: "SPEAK",
                        value: `Do you want to create an appointment with ${context.person} on ${context.day} at ${context.time}?`})))
                    },
                    prompt1: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Are your sure you want to create this meeting?`})))
                    },
                    prompt2: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Do you want me to create this appointment?`})))
                    },
                    prompt3: {
                        ...promptAndAsk(send((context) => ({
                            type: "SPEAK",
                            value: `Ok, last chance. Do you want to create an appointment with ${context.person} on ${context.day} at ${context.time}?`})))
                    },
                    maxspeech: {
                        entry: say("Sorry"),
                        on: { ENDSPEECH : [{
                            cond: (context) => context.count === 0,
                            target: "prompt"},
                            {
                            cond: (context) => context.count === 1,
                            target: "prompt1"},
            
                            { target: "prompt2",
                            cond: (context) => context.count === 2},
            
                            { target: "prompt3",
                            cond: (context) => context.count === 3},
                        
                            { target: "#root.dm.init",
                            cond: (context) => context.count === 4},  
                                ]}
                            },
                        },
                    },
                }
            },
            confirmed: {
                id: 'confirmed',
                initial: "prompt",
                on: { ENDSPEECH: "#root.dm.init" },
                states: {
                    prompt: {
                        entry: send((context) => ({
                            type: "SPEAK",
                            value: `Your appointment has been created!`
                        }))
                    },
                }
            }
        } 
    })





 