import { MachineConfig, send, Action, assign } from "xstate";

const proxyurl = "https://cors-anywhere.herokuapp.com/";
const rasaurl = 'https://assignment2nlu.herokuapp.com/model/parse'
const nluRequest = (text: string) =>
    fetch(new Request(proxyurl + rasaurl, {
        method: 'POST',
        headers: { 'Origin': 'https://justyna-sikora.github.io/assignment2ds' }, // only required with proxy
        body: `{"text": "${text}"}`
    }))
        .then(data => data.json());

//http://localhost:3000/react-xstate-colourchanger

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


export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'init',
    states: {
        init: {
            on: {
                CLICK: 'welcome'
            }
        },

        welcome: {
            id: "wlcm",
            initial: "prompt",
            on: {
            RECOGNISED: {
                target: 'query',
                actions: assign((context) => { return { query: context.recResult } }),
                    }
                },
                states: {
                    prompt: {
                        entry: say("What would you like to do?"),
                        on: { ENDSPEECH: "ask" }
                    },
                    ask: {
                        entry: listen()
                    },
                    nomatch: {
                        entry: say("Sorry I don't understand."),
                        on: { ENDSPEECH: "prompt" }
                    }
                }
        },
        query: {
            invoke: {
            id: 'rasa',
                    src: (context, event) => nluRequest(context.query),
            onDone: {
                    target: 'menu',
                        actions: [assign((context, event) => { return {intentbest: event.data }}),
                                (context:SDSContext, event:any) => console.log(event.data)]
                    },
            onError: {
                        target: 'welcome',
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
                { target: ".nomatch"}]
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
            on: { ENDSPEECH: "init" },
            states: {
                prompt: { entry: say("Welcome to the To do item app")
                 }
            }
        },
	    Timer: {
	        initial: "prompt",
	        on: { ENDSPEECH: "init" },
	        states: {
	    prompt: { entry: say ("Welcome to the Timer app")
	             }
	        }
	    },
        Appointment: {
            initial: "prompt",
            on: { ENDSPEECH: "who" },
            states: {
                prompt: { entry: say("Let's create an appointment") }
            }
        },
        who: {
            initial: "prompt",
            on: {
                RECOGNISED: [{
                    cond: (context) => "person" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { person: grammar[context.recResult].person } }),
                    target: "day"

                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: say("Who are you meeting with?"),
                    on: { ENDSPEECH: "ask" }
                },
                ask: {
                    entry: listen()
                },
                nomatch: {
                    entry: say("Sorry I don't know them"),
                    on: { ENDSPEECH: "prompt" }
                }
            }
        },
        day: {
            initial: "prompt",
            on:{
                RECOGNISED: [{
                    cond: (context) => "day" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { day: grammar[context.recResult].day } }),
                    target: "duration"
                },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.person}. On which day is your meeting?`
                        })),
		            on: { ENDSPEECH: "ask" }
                },
		        ask: {
		                entry: listen()
                },
	            nomatch: {
	    	            entry: say("Sorry, I don't understand"),
		                on: { ENDSPEECH: "prompt" }
	                 }
	             }
        },
    	duration: {
            initial: "prompt",
            on: {
                RECOGNISED: [{cond: (context) => (boolGrammar[context.recResult] === false),
                    target: "time"
                    },
		            {cond: (context) => (boolGrammar[context.recResult] === true),
		            target: "confirm_meeting_whole_day"
		            },
                    { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. ${context.person} on ${context.day}. Will it take the whole day?`
                    })),
		                on: { ENDSPEECH: "ask" }
                },
		        ask: {
		                entry: listen()
                },
	            nomatch: {
	    	            entry: say("Sorry, I don't understand"),
		                on: { ENDSPEECH: "prompt" }
	            }
            }
	    },
	    time: {
            initial: "prompt",
            on: { RECOGNISED: [{
                    cond: (context) => "time" in (grammar[context.recResult] || {}),
                    actions: assign((context) => { return { time: grammar[context.recResult].time } }),
                    target: "confirm_time"
                    },
                    { target: ".nomatch" }]
		    },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `OK. What time is your meeting?`
                        })),
		                on: { ENDSPEECH: "ask" }
                },
		        ask: {
		                entry: listen()
                },
	            nomatch: {
	                	entry: say("Sorry, I don't understand"),
		                on: { ENDSPEECH: "prompt" }
	                }
                }
        },
	    confirm_meeting_whole_day: {
            initial: "prompt",
            on: {
                RECOGNISED: [{cond: (context) => (boolGrammar[context.recResult] === false),
                    target: "init"
                    },
		            {cond: (context) => (boolGrammar[context.recResult] === true),
		            target: "confirmed"
		             },
                    { target: ".nomatch" }]
            },
            states: {
                prompt: {
                    entry: send((context) => ({
                        type: "SPEAK",
                        value: `Do you want to create an appointment with ${context.person} on ${context.day} for the whole day?`
                        })),
		                on: { ENDSPEECH: "ask" }
                },
	        	ask: {
		            entry: listen()
                },
	            nomatch: {
	    	        entry: say("Sorry, I don't understand"),
		            on: { ENDSPEECH: "prompt" }
	            }
            }
	    },
 	    confirm_time: {
            initial: "prompt",
            on:  {
                RECOGNISED: [{cond: (context) => (boolGrammar[context.recResult] === false),
                    target: "who"
                },
		        {cond: (context) => (boolGrammar[context.recResult] === true),
		        target: "confirmed"
		        },
                { target: ".nomatch" }]
            },
            states: {
                prompt: {
                   entry: send((context) => ({
                        type: "SPEAK",
                        value: `Do you want to create an appointment with ${context.person} on ${context.day} at ${context.time}?`
                })),
		        on: { ENDSPEECH: "ask" }
                },
		        ask: {
		             entry: listen()
                     },
	            nomatch: {
	    	        entry: say("Sorry, I don't understand"),
	            	on: { ENDSPEECH: "prompt" }
	           }
            },
        },
	    confirmed: {
            initial: "prompt",
            on: { ENDSPEECH: "init" },
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





