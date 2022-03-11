/* eslint-disable */
import { Dialog, DialogTemplate, DialogType, FileType } from "../../common/js/dialog.js";
import { SetOpenImagePreview } from "../../common/js/menus.js";

const light_accent = '#cea964'
const accent_black = '#1e1e1e'

/// The <div> containing the ui to set up a game
let create_game = document.getElementById('create-game') as HTMLElement
/// The <div> containing all the characters
let character_selects = document.getElementById('character-selects') as HTMLElement

let game_title = document.getElementById('game-title') as HTMLElement
let game_content = document.getElementById('game-content') as HTMLElement
let game_before_content = document.getElementById('game-before-content') as HTMLElement
let start_game_button = document.getElementById('start-game-button') as HTMLElement

let game_character_template = (<HTMLTemplateElement>document.getElementById('game-character-setup-template')).content
let event_message_template = (<HTMLTemplateElement>document.getElementById('event-message-template')).content
let death_message_template = (<HTMLTemplateElement>document.getElementById('death-message-template')).content
let game_fatalities_template = (<HTMLTemplateElement>document.getElementById('game-fatalities-template')).content
let tribute_stats_wrapper_template = (<HTMLTemplateElement>document.getElementById('tribute-stats-wrapper-template')).content
let tribute_stats_template = (<HTMLTemplateElement>document.getElementById('tribute-stats-template')).content
let edit_events_table_template = (<HTMLTemplateElement>document.getElementById('edit-events-table-template')).content

let current_players = document.getElementById('current-players') as HTMLElement
let player_count = 0

character_selects.innerHTML +=
    `<div id="add-character-button-wrapper">`
    + `<button id="add-character" type="button"></button>`
    + `</div>`
let add_character_button = document.getElementById('add-character-button-wrapper') as HTMLElement

/// Add two characters to begin with
AddCharacter()
AddCharacter()

// @ts-ignore
window.AddCharacter = AddCharacter

function AddCharacter() {
    add_character_button.remove()
    current_players.innerHTML = 'Current Players: ' + ++player_count
    character_selects.appendChild(game_character_template.cloneNode(true))
    character_selects.appendChild(add_character_button)
    RegisterEventListeners()
}

/// This function takes care of displaying/hiding the
/// custom gender input when appropriate
function ChangeSelect(select) {
    let input = select.parentElement.parentElement.getElementsByClassName('custom-gender-input-wrapper')[0]
    input.style.display = (select.value === 'other' ? 'flex' : 'none')
}

function GetImage(img: HTMLImageElement) {
    OpenFileDialog({
        title: 'Select an image',
        title_style: {
            background: light_accent,
            color: '#463c2a'
        } as CSSStyleDeclaration,
        preserve_extern_urls: true,
        description: 'You can input a local file or a public url. The image can be in any format your browser supports.',
    }).then(dialog => {
        if (dialog) img.src = dialog.file_data
    })
}

function RegisterEventListeners() {
    for (let img of document.getElementsByClassName('tribute-image') as HTMLCollectionOf<HTMLElement>)
        img.onclick = () => GetImage(img as HTMLImageElement)
    for (let select of document.getElementsByClassName('gender-select') as HTMLCollectionOf<HTMLElement>)
        select.onchange = () => ChangeSelect(select)
    for (let button of document.getElementsByClassName('character-delete') as HTMLCollectionOf<HTMLElement>)
        button.onclick = () => {
            // @ts-ignore
            button.parentElement.parentElement.parentElement.remove()
            current_players.innerHTML = 'Current Players: ' + --player_count
        }
    for (let button of document.getElementsByClassName('image-remove'))
        // @ts-ignore
        button.onclick = () => button.parentElement.parentElement.parentElement.children[1].children[0].src = ''

    add_character_button.onclick = () => AddCharacter()
}

function OpenErrorDialog(message: string) {
    return Dialog.open({
        type: DialogType.ERROR,
        title: 'Error',
        root_style: {
            color: 'white',
            background: accent_black,
            maxWidth: '13cm'
        } as CSSStyleDeclaration,
        description: message,
        ok: 'Ok',
    })
}

function OpenConfirmDialog(message: string) {
    return Dialog.open({
        title: 'Warning',
        root_style: {
            color: 'white',
            background: accent_black,
            maxWidth: '13cm',
        } as CSSStyleDeclaration,
        description: message,
        accept: 'Yes',
        cancel: 'No',
    })
}

function OpenFileDialog(options: DialogTemplate) {
    return Dialog.open({
        ...options,
        type: DialogType.FILE,
        accept: 'Ok',
        cancel: 'Cancel',
        root_style: {
            maxWidth: '13cm',
            color: 'white',
            background: accent_black
        } as CSSStyleDeclaration,
    })
}

/// =========================================================================================
/// ========================================= GAME ==========================================
/// =========================================================================================
const char_zero = '0'.charCodeAt(0)
const char_nine = '9'.charCodeAt(0)

function isdigit(char: string): boolean {
    let c = char.charCodeAt(0)
    return c >= char_zero && c <= char_nine
}

function random(from: number, to: number): number {
    return Math.floor(Math.random() * (to - from)) + from
}

function shuffle<T>(array: T[]): T[] {
    if (array.length < 2) return array;
    for (let i = array.length - 1; i > 0; i--) {
        let j = random(0, i)
        let k = array[i]
        array[i] = array[j]
        array[j] = k
    }
    return array;
}

function RemoveAllChildNodes(parent: HTMLElement) {
    while (parent.firstChild) parent.removeChild(parent.firstChild)
}


/// Generate a message describing an event based on the
/// event's message template and the tributes involved
function ComposeEventMessage(event: GameEvent): string {
    let m = event.event.message
    let composed = ''
    let prev = 0, i = 0
    outer:
        for (; ;) {
            while (i < m.length && m[i] !== '%') i++
            composed += m.slice(prev, i)
            prev = i
            if (i >= m.length) break
            i++ /// yeet %
            if (i >= m.length) break

            switch (m[i]) {
                case '0':
                case '1':
                case '2':
                case '3':
                case '4':
                case '5':
                case '6':
                case '7':
                case '8':
                case '9': {
                    let name = event.players_involved[m[i].charCodeAt(0) - char_zero].name
                    composed += name
                    i++
                    if (i >= m.length) break outer; /// yeet %
                    break;
                }
                case 'N':
                case 'A':
                case 'G':
                case 'R':
                case 's':
                case 'y':
                case 'i':
                case '!': {
                    let c = m[i++];
                    if (isdigit(m[i])) {
                        let index = m[i].charCodeAt(0) - char_zero
                        let char_what = ''
                        let text
                        let tribute = event.players_involved[index]
                        switch (c) {
                            case 'N':
                                text = tribute.uses_pronouns ? tribute.pronouns.nominative : tribute.name
                                break
                            case 'A':
                                text = tribute.uses_pronouns ? tribute.pronouns.accusative : tribute.name
                                break
                            case 'G':
                                text = tribute.uses_pronouns ? tribute.pronouns.genitive : tribute.name + '’s'
                                break
                            case 'R':
                                text = tribute.uses_pronouns ? tribute.pronouns.reflexive : tribute.name
                                break
                            case 's': /// 3SG /-s
                                text = tribute.plural ? '' : 's'
                                break
                            case 'y': /// 3SG -y/-ies
                                text = tribute.plural ? 'y' : 'ies'
                                break
                            case 'i': /// 3SG are/is
                                text = tribute.plural ? 'are' : 'is'
                                break
                            case '!': /// 3SG aren't/isn't
                                text = tribute.plural ? 'aren\'t' : 'isn\'t'
                                break
                            default:
                                continue
                        }
                        composed += text
                        i++
                    } else continue;
                    break;
                }
                default:
                    continue;
            }
            prev = i;
        }
    if (prev < m.length) composed += m.slice(prev)
    return composed
}

/// Calculate the number of tributes required based on the message template
function CalculateTributesInvolved(raw_message) {
    return raw_message.match(/%[NAGRsyi!]?(\d)/g)
            ?.map(x => x.slice(-1))
            ?.reduce((prev, curr) => Math.max(prev, curr), 0) + 1
        ?? 0
}

interface TributePronouns {
    nominative?: string
    accusative?: string
    genitive?: string
    reflexive?: string
}

interface TributeOptions {
    uses_pronouns: boolean
    pronouns: TributePronouns
    image_src: string
    plural: boolean
    name: string
    gender_select: string
    custom_pronouns: string
    image?
}

class Tribute {
    raw_name: string
    pronouns: TributePronouns
    uses_pronouns: boolean
    image_src: string
    plural: boolean
    kills: number
    died_in_round: number
    constructor(name: string, options: TributeOptions) {
        this.raw_name = name
        this.pronouns = {}
        this.uses_pronouns = options.uses_pronouns ?? true
        if (this.uses_pronouns) {
            this.pronouns.nominative = options.pronouns.nominative
            this.pronouns.accusative = options.pronouns.accusative
            this.pronouns.genitive = options.pronouns.genitive
            this.pronouns.reflexive = options.pronouns.reflexive
        }
        this.image_src = options.image_src ?? ''
        this.plural = options.plural ?? false
        this.kills = 0
        this.died_in_round = 0
    }

    get name() {
        return `<span class="tribute-name">${this.raw_name}</span>`
    }

    get image() {
        return `<img class="tribute-image" alt="${this.raw_name}" src="${this.image_src}"></img>`
    }
}

class Event {
    static __last_id = -1
    message: string
    players_involved: number
    fatalities: number[]
    killers: number[]
    enabled: boolean
    id: number
    type: string

    constructor(message: string, fatalities: number[] = [], killers: number[] = [], type = 'BUILTIN') {
        this.message = message
        this.players_involved = CalculateTributesInvolved(message)
        if (this.players_involved < 1) {
            OpenErrorDialog(`Event '${message}' is ill-formed. Events must involve at least 1 and at most 9 players.`)
            throw Error(`Event '${message}' is ill-formed`)
        }
        this.fatalities = fatalities
        this.killers = killers
        this.enabled = true
        this.id = ++Event.__last_id
        this.type = type
    }
}

class GameEvent {
    event: Event
    players_involved: Tribute[]
    message: string

    constructor(event, players_involved) {
        this.event = event
        this.players_involved = players_involved
        this.message = ComposeEventMessage(this)
    }
}

function download(filename: string, url: string) {
    let a = document.createElement('a')
    a.setAttribute('href', url)
    a.setAttribute('download', filename)
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    a.remove()
}

function ObjectToDataURL(obj: any) {
    return 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(obj, null, 4))
}

class EventsDialog extends Dialog {
    events_table: HTMLTableElement
    events_disabled_map: Map<any, any>
}

interface EventsShadowRoot extends ShadowRoot {
    events_disabled_map: Map<any, any>
}

const UI = {
    events_dialog: {} as Dialog | null,
    OpenEventDialog() {
        let div = document.createElement('div')
        div.style.display = 'block'
        div.attachShadow({mode: 'open'})
        let shadow = div.shadowRoot as EventsShadowRoot
        shadow.appendChild(edit_events_table_template.cloneNode(true))
        shadow.events_disabled_map = new Map()

        let dialog = new EventsDialog({
            title: 'Edit Events',
            title_style: {
                background: light_accent,
                color: '#463c2a'
            } as CSSStyleDeclaration,
            description: 'You can add, remove, select, and deselect events below',
            description_style: {
                textAlign: 'center',
                marginBottom: '-1rem'
            } as CSSStyleDeclaration,
            root_style: {
                color: 'white',
                background: accent_black
            } as CSSStyleDeclaration,
            accept: 'Ok',
            cancel: 'Close',
            apply: 'Apply',
            apply_callback: (d: EventsDialog) => UI.ApplyEventChanges(d),
            postdescription: div,
        })

        UI.events_dialog = dialog
        dialog.events_table = shadow.getElementById('edit-events-table') as HTMLTableElement
        dialog.events_disabled_map = shadow.events_disabled_map

        UI.DisplayEvents()

        dialog.open().then((dialog) => {
            if (dialog) UI.ApplyEventChanges(dialog.dialog as EventsDialog)
            UI.events_dialog = null
        })
    },

    DisplayEvents() {
        let tbodies: HTMLElement[] = []
        for (let el of (<EventsDialog>UI.events_dialog).events_table.children)
            if (el.tagName === 'TBODY') tbodies.push(el as HTMLElement)
        for (let el of tbodies) el.remove()

        let events = new Map()

        for (let event_list of Object.keys(Game.event_lists)) {

            if (!events.has(event_list)) events.set(event_list,
                `<tbody class="edit-events-tbody"><tr class="event-list-stage-header"><td></td><td>` +
                `${event_list.charAt(0).toUpperCase() + event_list.slice(1)}</td><td></td><td></td><td></td></tr>`)

            let lst = events.get(event_list)

            for (let event of Game.event_lists[event_list])
                lst += `<tr onclick="CheckCheckbox(this)"><td><input data-id='${event.id}' `
                    + `onclick="HandleCheckbox(this)" type="checkbox" ${event.enabled ? 'checked' : ''}></td>`
                    + `<td>${event.message}</td><td>${event.type}</td><td>${event.fatalities}</td>`
                    + `<td>${event.killers}</td></tr>`

            events.set(event_list, lst)
        }

        for (let lst of Object.keys(Game.event_lists))
            (<EventsDialog>UI.events_dialog).events_table
                .insertAdjacentHTML('beforeend', events.get(lst) + '</tbody>')
    },

    ApplyEventChanges(dialog: EventsDialog) {
        if (dialog) {
            for (let event_list of Object.keys(Game.event_lists))
                for (let event of Game.event_lists[event_list])
                    if (dialog.events_disabled_map.has(event.id))
                        event.enabled = false
        }

    },

    DownloadEvents() {
        download('events.json', ObjectToDataURL(Game.event_lists))
    },

    LoadAddEvents(overwrite = false) {
        OpenFileDialog({
            title: 'Select a file',
            title_style: {
                background: light_accent,
                color: '#463c2a'
            } as CSSStyleDeclaration,
            input_file_format: FileType.JSON,
            preserve_extern_urls: true,
            description: 'Please click on the button to choose a local file or simply input a URL.'
        }).then((dialog) => {
            if (dialog) {
                if (overwrite) Game.event_lists = dialog.file_data
                else for (let event_list of Object.keys(dialog.file_data))
                    main_event_loop: for (let event of dialog.file_data[event_list]) {
                        for (let current_event_list of Object.keys(Game.event_lists))
                            for (let current_event of Game.event_lists[current_event_list]) {
                                if (current_event.message === event.message) continue main_event_loop
                            }
                        (Game.event_lists[event_list] ??= []).push(event)
                    }

                UI.ApplyEventChanges(UI.events_dialog as EventsDialog)
                UI.DisplayEvents()
            }
        })
    },

    ResetEvents() {
        OpenConfirmDialog('This will reset the event lists to their builtin state. Continue?').then((dialog) => {
            if (dialog) Game.event_lists = JSON.parse(JSON.stringify(builtin_event_lists))
            UI.DisplayEvents()
        })
    },

    SaveSetup() {
        /// Serialise Tributes
        let state = {
            characters: [] as TributeOptions[],
            events: Game.event_lists
        }

        for (let character of document.getElementsByClassName('game-character')) {
            let options = {} as TributeOptions

            /// Name
            options.name = (<HTMLInputElement>character.getElementsByClassName('character-name')[0]).value.trim()

            /// Pronouns & Number
            options.gender_select = (<HTMLInputElement>character.getElementsByClassName('gender-select')[0]).value
            options.custom_pronouns = (<HTMLInputElement>character.getElementsByClassName('custom-gender-input')[0]).value.trim()

            /// Image
            options.image = (<HTMLImageElement>character.getElementsByClassName('tribute-image')[0]).src?.trim()
            if (!options.image) delete options.image

            state.characters.push(options)
        }

        download('hgsimulator-setup.json', ObjectToDataURL(state));
    },

    LoadSetup() {
        OpenFileDialog({
            title: 'Load Game Setup',
            title_style: {
                background: light_accent,
                color: '#463c2a'
            } as CSSStyleDeclaration,
            preserve_extern_urls: true,
            description: 'Click below to upload a save. This will override the current setup. Unsaved changes will be lost!',
        }).then(dialog => {
            if (dialog) {
                fetch(dialog.file_data).then(d => {
                    d.json().then(save => {
                        Game.event_lists = save.events

                        let chars: Element[] = []
                        for (let char of document.getElementsByClassName('game-character') as HTMLCollectionOf<Element>) {
                            chars.push(char)
                        }
                        chars.forEach(x => x.remove())

                        player_count = 0
                        for (let i = 0; i < save.characters.length; i++) AddCharacter()

                        let i = 0
                        for (let character of document.getElementsByClassName('game-character')) {
                            let select = character.getElementsByClassName('gender-select')[0] as HTMLSelectElement
                            (<HTMLInputElement>character.getElementsByClassName('character-name')[0])
                                .value = save.characters[i].name
                            select.value = save.characters[i].gender_select
                            (character.getElementsByClassName('custom-gender-input')[0] as HTMLInputElement)
                                .value = save.characters[i].custom_pronouns
                            if ('image' in save.characters[i]) (<HTMLImageElement>character.getElementsByClassName('tribute-image')[0])
                                .src = save.characters[i].image
                            // @ts-ignore
                            let input = select.parentElement.parentElement.getElementsByClassName('custom-gender-input-wrapper')[0] as HTMLElement
                            input.style.display = (select.value === 'other' ? 'flex' : 'none')
                            i++
                        }
                    })
                })
            }
        })
    }
}

enum GameState {
    DEAD,
    INITIAL,
    ROUND_PART_1,
    ROUND_PART_2,
    ROUND_RESULTS,
    END_RESULTS,
    END_WINNER,
    END_NO_WINNER,
    END_SUMMARY_FATALITIES,
    END_SUMMARY_STATS,
    END,
}

enum GameStage {
    BLOODBATH = 'bloodbath',
    DAY = 'day',
    NIGHT = 'night',
    FEAST = 'feast'
}

interface GameEventList {
    bloodbath: Event[],
    day: Event[],
    night: Event[],
    feast: Event[]
}

interface GameRound {
    game_events: GameEvent[],
    tributes_dead: Tribute[],
    messages: string[],
    number: number,
    stage: GameStage
}

interface EventList {
    bloodbath?: Event[],
    day?: Event[],
    night?: Event[],
    feast?: Event[]
    all?: Event[]
}

class Game {
    static ComposeEventMessage = ComposeEventMessage
    static Tribute = Tribute
    static Event = Event
    static UI = UI
    static event_lists: EventList
    static active_game_instance: Game | null

    tributes: Tribute[]
    tributes_alive: Tribute[]
    tributes_dead: Tribute[]
    tributes_died: Tribute[]
    round: number
    last_round: GameRound
    last_feast: number
    state: GameState
    stage: GameStage
    exceptions: number
    fatality_reroll_rate: number
    all_won: boolean
    rounds: GameRound[]
    days_passed: number
    nights_passed: number
    events: GameEventList

    constructor(tributes, options?) {
        this.tributes = Array.of(...tributes)
        this.tributes_alive = tributes
        this.tributes_dead = []
        this.tributes_died = []
        this.round = 1
        this.last_feast = 1
        this.state = GameState.INITIAL
        this.stage = GameStage.BLOODBATH
        this.exceptions = 0
        this.fatality_reroll_rate = options?.fatality_reroll_rate ?? .60
        this.all_won = false
        this.rounds = []
        this.days_passed = 0
        this.nights_passed = 0

        this.events = {
            bloodbath: [],
            day: [],
            night: [],
            feast: []
        }

        this.AddEvents(Game.event_lists)
    }

    AddEvents(event_option_list: EventList) {
        if (event_option_list.all) {
            for (let event_list of [this.events.bloodbath, this.events.day, this.events.night, this.events.feast])
                event_list.push(...event_option_list.all.filter(e => e.enabled))
        }

        for (let property of [GameStage.BLOODBATH, GameStage.DAY, GameStage.NIGHT, GameStage.FEAST])
            if (event_option_list[property])
                this.events[property].push(...(<Event[]>event_option_list[property]).filter(e => e.enabled))
    }

    NextGameStage() {
        /// Start of game is always STAGE_BLOODBATH
        if (this.round === 1) {
            this.stage = GameStage.BLOODBATH
            return
        }

        if (this.stage === GameStage.FEAST || this.stage === GameStage.BLOODBATH) {
            this.days_passed++
            this.stage = GameStage.DAY
            return
        }

        if (this.stage === GameStage.NIGHT) {
            /// Feast can occur before Day once every 5+ as follows
            /// 5 rounds: 25% chance
            /// 6 rounds: 33% chance
            /// 7+ rounds: 50% chance

            let rounds_since_feast = this.round - this.last_feast;

            if (rounds_since_feast >= 5) block: {
                if (rounds_since_feast >= 7) {
                    if (Math.random() > .50 * (rounds_since_feast - 4)) break block
                } else if (rounds_since_feast >= 6) {
                    if (Math.random() > .33 * (rounds_since_feast - 4)) break block
                } else {
                    if (Math.random() > .25 * (rounds_since_feast - 4)) break block
                }

                this.last_feast = this.round;
                this.stage = GameStage.FEAST
                return
            }

            /// Otherwise, it's Day
            this.days_passed++
            this.stage = GameStage.DAY
            return
        }

        this.nights_passed++
        this.stage = GameStage.NIGHT
    }

    static PrepareDebugGame(players = 10) {
        for (let i = 0; i < players - 2; i++) AddCharacter()

        let i = 0
        for (let character of document.getElementsByClassName('game-character')) {
            (<HTMLInputElement>character.getElementsByClassName('character-name')[0]).value = `Player${i}`;
            (<HTMLImageElement>character.getElementsByClassName('tribute-image')[0]).src = '/images/index/slide5.png'
            i++
        }
    }

    NextRound(): GameRound {
        /// Get the number of tributes
        let tributes_left = this.tributes_alive.length
        let tributes_alive = tributes_left
        let current_tribute = 0

        /// Get the appropriate game stage
        this.NextGameStage()

        let round = {
            game_events: [],
            tributes_dead: [],
            messages: [],
            number: this.round,
            stage: this.stage
        } as GameRound

        /// Shuffle the tributes to randomise the encounters
        shuffle(this.tributes_alive)

        let event_list
        switch (this.stage) {
            case GameStage.BLOODBATH:
                event_list = this.events.bloodbath
                break
            default:
                console.error(`Unsupported stage '${this.stage}'`)
            /// fallthrough
            case GameStage.DAY:
                event_list = this.events.day
                break
            case GameStage.NIGHT:
                event_list = this.events.night
                break
            case GameStage.FEAST:
                event_list = this.events.feast
                break
        }

        /// Randomly pick an event from the corresponding event list
        /// whose number of tributes involved does not exceed the number
        /// of tributes left. Ensure that every tribute is only picked once.
        /// Repeat until no tributes are left
        while (tributes_left) {
            let tributes_involved: Tribute[] = []
            let event

            /// Keep choosing events at random until we hit one that does not
            /// need more tributes than are left
            do event = event_list[random(0, event_list.length)]
            while (event.players_involved > tributes_left
            || (event.fatalities.length && Math.random() < this.fatality_reroll_rate))
            tributes_left -= event.players_involved

            /// Handle fatalities
            for (const f of event.fatalities) {
                this.tributes_alive[current_tribute + f].died_in_round = this.round
                round.tributes_dead.push(this.tributes_alive[current_tribute + f])
                tributes_alive--
            }

            for (const k of event.killers) this.tributes_alive[current_tribute + k].kills++

            /// Add all players affected to the event
            let last = current_tribute + event.players_involved
            for (; current_tribute < last; current_tribute++) tributes_involved.push(this.tributes_alive[current_tribute])

            round.game_events.push(new GameEvent(event, tributes_involved))
            if (tributes_alive < 2) break
        }
        return round;
    }

    SecureDoRound() {
        let ret
        let _round = this.round
        let _tributes_alive = [...this.tributes_alive]
        let _last_feast = this.last_feast
        let _tributes_dead = [...this.tributes_dead]
        let _stage = this.stage
        let _state = this.state
        let _days_passed = this.days_passed
        let _nights_passed = this.nights_passed

        for (; ;) try {
            ret = this.NextRound()
            break
        } catch (e) {
            if (++this.exceptions > 1000) {
                OpenErrorDialog('Too many exceptions (> 1000)! Aborted.')
                console.log(e.stack)
                this.state = GameState.DEAD
                throw e
            }

            this.round = _round
            this.tributes_alive = _tributes_alive
            this.last_feast = _last_feast
            this.tributes_dead = _tributes_dead
            this.stage = _stage
            this.state = _state
            this.days_passed = _days_passed
            this.nights_passed = _nights_passed

        }

        if (this.round === 10) this.fatality_reroll_rate /= 2

        return ret
    }

    DisplayRound() {
        if (this.stage === GameStage.DAY) game_title.innerHTML = `Day ${this.days_passed}`
        else if (this.stage === GameStage.NIGHT) game_title.innerHTML = `Night ${this.nights_passed}`
        else game_title.innerHTML = this.stage

        DisplayMessages(this.last_round.game_events, event_message_template, (event, message) => {
            let image_wrapper = message.getElementsByClassName('event-message-images')[0]
            for (const tribute of event.players_involved) image_wrapper.innerHTML += `<div class="image-wrapper">${tribute.image}</div>`
            message.getElementsByClassName('event-message')[0].innerHTML = event.message
        })

        for (const tribute of this.last_round.tributes_dead) {
            this.tributes_alive.splice(this.tributes_alive.indexOf(tribute), 1)
            this.tributes_died.push(tribute)
        }

    }

    DisplayRoundResults() {
        game_title.innerHTML = 'The Fallen'

        if (this.tributes_died.length) {
            DisplayMessages(this.tributes_died, death_message_template, (tribute, message) => {
                message.getElementsByClassName('death-message-image')[0].innerHTML += tribute.image
                message.getElementsByClassName('death-message')[0].innerHTML = tribute.name + ' has died this round'
            })
            DisplayBefore(`${this.tributes_died.length} cannon shot${this.tributes_died.length === 1 ? '' : 's'} can be heard in the distance.`)
            this.tributes_dead.push(...this.tributes_died)
        } else {
            RemoveAllChildNodes(game_content)
            DisplayBefore('No cannon shots can be heard in the distance.')
        }

        this.tributes_died = []
    }

    DisplayWinners() {
        game_title.innerHTML = 'The Games have ended'

        ClearMessages()
        game_content.appendChild(event_message_template.cloneNode(true))
        let message = game_content.children[0]

        for (const tribute of this.tributes_alive)
            message.getElementsByClassName('event-message-images')[0].innerHTML += `<div class="image-wrapper">${tribute.image}</div>`

        let text

        if (this.tributes_alive.length === 1) text = `The winner is ${this.tributes_alive[0].name}!`
        else if (this.tributes_alive.length === 2) text = `The winners are ${this.tributes_alive[0].name} and ${this.tributes_alive[1].name}`
        else {
            text = 'The winners are '
            let i = 0
            for (; i < this.tributes_alive.length - 1; i++) text += `${this.tributes_alive[i].name}, `
            text += `and ${this.tributes_alive[i].name}!`
        }

        message.getElementsByClassName('event-message')[0].innerHTML = text
    }

    DisplayNoWinner() {
        game_title.innerHTML = 'The Games have ended'

        ClearMessages()
        game_content.appendChild(event_message_template.cloneNode(true))
        let message = game_content.children[0]

        message.getElementsByClassName('event-message')[0].innerHTML = 'There are no survivors.'
    }

    DisplayFinalFatalities() {
        game_title.innerHTML = 'Deaths'

        DisplayMessages(this.rounds, game_fatalities_template, (round, message) => {
            message.getElementsByClassName('round-title')[0].innerHTML = `Round ${round.number}: ${round.stage}`
            let fatalities = ''
            for (const event of round.game_events) if (event.event.fatalities.length) fatalities += event.message + '<br>'
            message.getElementsByClassName('round-fatalities')[0].innerHTML = fatalities === '' ? 'No-one died' : fatalities
        })
    }

    DisplayFinalStats() {
        ClearMessages()
        game_content.classList.add('flex-wrap')
        game_content.appendChild(tribute_stats_wrapper_template.cloneNode(true))

        if (this.tributes_alive.length) {
            game_title.innerHTML = 'Winners'
            let alive_stats = game_content.getElementsByClassName('alive-stats')[0]
            for (const tribute of this.tributes_alive) alive_stats.appendChild(tribute_stats_template.cloneNode(true))
            AppendMessages(alive_stats.children, this.tributes_alive)
        } else {
            game_content.getElementsByClassName('alive-stats-wrapper')[0].remove()
            game_content.getElementsByClassName('tribute-stats-header')[0].remove()
            game_title.innerHTML = 'The Fallen'
        }

        if (this.tributes_dead.length) {
            let dead_stats = game_content.getElementsByClassName('dead-stats')[0]
            for (const tribute of this.tributes_dead) dead_stats.appendChild(tribute_stats_template.cloneNode(true))
            AppendMessages(dead_stats.children, this.tributes_dead.reverse())
        } else game_content.getElementsByClassName('dead-stats-wrapper')[0].remove()
    }

    ReturnToMainMenu() {
        (<HTMLButtonElement>document.getElementById('advance-game')).onclick = null
        ClearMessages()
        create_game.style.display = 'block';
        (<HTMLDivElement>document.getElementById('game')).style.display = 'none'
    }

    CheckGameShouldEnd() {
        if (this.tributes_alive.length < 2 || this.all_won) {
            this.state = GameState.END_RESULTS
            return true
        }

        return false
    }

    AdvanceGame() {
        window.scrollTo(0, 0)
        /// Advance the state and perform and action accordingly
        switch (this.state) {
            case GameState.INITIAL:
            case GameState.ROUND_PART_1: {
                this.last_round = this.SecureDoRound()
                this.DisplayRound()
                this.rounds.push(this.last_round)
                this.round++

                if (!this.CheckGameShouldEnd())
                    if (this.stage !== GameStage.BLOODBATH && this.stage !== GameStage.FEAST)
                        this.state = GameState.ROUND_PART_2
                break
            }

            case GameState.ROUND_PART_2: {
                this.last_round = this.SecureDoRound()
                this.DisplayRound()
                this.rounds.push(this.last_round)
                this.round++

                if (!this.CheckGameShouldEnd()) this.state = GameState.ROUND_RESULTS
                break
            }

            case GameState.ROUND_RESULTS: {
                this.DisplayRoundResults()
                this.state = GameState.ROUND_PART_1
                break
            }

            case GameState.END_RESULTS: {
                this.DisplayRoundResults()
                if (!this.tributes_alive.length) this.state = GameState.END_NO_WINNER
                else this.state = GameState.END_WINNER
                break
            }

            case GameState.END_WINNER: {
                this.DisplayWinners()
                this.state = GameState.END_SUMMARY_FATALITIES
                break
            }

            case GameState.END_NO_WINNER: {
                this.DisplayNoWinner()
                this.state = GameState.END_SUMMARY_FATALITIES
                break
            }

            case GameState.END_SUMMARY_FATALITIES: {
                this.DisplayFinalFatalities()
                this.state = GameState.END_SUMMARY_STATS
                break
            }

            case GameState.END_SUMMARY_STATS: {
                this.DisplayFinalStats()
                this.state = GameState.END
                start_game_button.innerHTML = "End Game"
                break
            }

            case GameState.END: {
                this.ReturnToMainMenu()
                Game.active_game_instance = null
                start_game_button.innerHTML = "Proceed"
                break
            }

            default: {
                OpenErrorDialog('An internal error has occurred; Game.state was ' + this.state)
                console.error('An internal error has occurred; Game.state was ' + this.state)
                this.state = GameState.DEAD
                throw new Error('unreachable')
            }

        }

        SetOpenImagePreview()
    }

    static CreateGame() {
        if (Game.active_game_instance) {
            OpenErrorDialog('Cannot start a new game while a game is already running. Reload the page if you want to abort your current game and start a new one.')
            return
        }

        let tributes: Tribute[] = []

        /// Get tributes
        for (let character of document.getElementsByClassName('game-character')) {
            let options = {} as TributeOptions

            /// Name
            let name = (<HTMLInputElement>character.getElementsByClassName('character-name')[0]).value.trim()
            if (!name) {
                OpenErrorDialog('One or more character names are empty!')
                return
            }

            /// Pronouns & Number
            let option = (<HTMLInputElement>character.getElementsByClassName('gender-select')[0]).value
            if (option === 'n') options.uses_pronouns = false
            else {
                let pronoun_str
                switch (option) {
                    case 'm':
                        pronoun_str = 'he/him/his/himself'
                        break
                    case 'f':
                        pronoun_str = 'she/her/her/herself'
                        break
                    case 'c':
                        pronoun_str = 'they/them/their/themself'
                        options.plural = true
                        break
                    case 'n':
                        options.uses_pronouns = false
                        break
                    case 'other':
                        pronoun_str = (<HTMLInputElement>character.getElementsByClassName('custom-gender-input')[0]).value.trim()
                        pronoun_str = pronoun_str.replaceAll('//', '\x1f')
                        if (!pronoun_str.match(/.+\/.+\/.+\/.+/)) {
                            OpenErrorDialog('Custom pronouns must be of the form <code>nom/acc/gen/reflx</code>. Example: <code>they/them/their/themself</code>.')
                            return
                        }
                }

                if (pronoun_str) {
                    let pronouns: string[] = pronoun_str.split('/').map(x => x.replaceAll('\x1f', '//').trim())
                    if (pronouns.includes('')) {
                        OpenErrorDialog('Custom pronouns may not be empty! You have to specify at least one non-whitespace character for each pronoun.')
                        return
                    }

                    options.pronouns = {
                        nominative: pronouns[0],
                        accusative: pronouns[1],
                        genitive: pronouns[2],
                        reflexive: pronouns[3]
                    }
                }
            }

            /// Image
            let src = (<HTMLImageElement>character.getElementsByClassName('tribute-image')[0]).src?.trim()
            if (src) options.image_src = src
            else options.image_src = '/images/index/slide5.png'

            tributes.push(new Tribute(name, options))
        }

        game_content.classList.remove('flex-wrap')

        Game.active_game_instance = new Game(tributes)

        create_game.style.display = 'none';
        (<HTMLDivElement>document.getElementById('game')).style.display = 'block'

        Game.active_game_instance.AdvanceGame();
        (<HTMLButtonElement>document.getElementById('advance-game')).onclick =
            () => (<Game>Game.active_game_instance).AdvanceGame.call(Game.active_game_instance)
    }

    static AbortGame() {
        Dialog.open({
            title: 'Warning',
            title_style: {
                background: light_accent,
                color: '#463c2a'
            } as CSSStyleDeclaration,
            root_style: {
                maxWidth: '13cm',
                color: 'white',
                background: accent_black
            } as CSSStyleDeclaration,
            description: 'Your progress will be lost. Are you sure you want to abort the game?',
            accept: 'Yes',
            cancel: 'No',
        }).then(dialog => {
            if (dialog) {
                if (!Game.active_game_instance) return
                Game.active_game_instance.state = GameState.END
                Game.active_game_instance.AdvanceGame()
            }
        })
    }
}

function DisplayBefore(text: string) {
    game_before_content.style.display = 'block'
    game_before_content.innerHTML = text
}

function ClearMessages() {
    RemoveAllChildNodes(game_content)
    game_before_content.style.display = 'none'
}

function DisplayMessages(collection: any[], template: DocumentFragment, callback: any) {
    ClearMessages()

    for (const element of collection) game_content.appendChild(template.cloneNode(true))
    let messages = game_content.children

    for (const i in collection) {
        let element = collection[i]
        let message = messages[i]

        callback(element, message as HTMLElement)
    }
}

function AppendMessages(to: HTMLCollection, from: Tribute[]) {
    if (from.length) {
        for (const i in from) {
            const tribute = from[i]
            let message = to[i]

            message.children[0].innerHTML = tribute.image
            message.children[1].innerHTML = tribute.name
            if (tribute.kills) message.children[2].innerHTML = 'Kills: ' + tribute.kills
            message.children[3].innerHTML = tribute.died_in_round ? 'Died: Round ' + tribute.died_in_round : '<span class="tribute-winner">⭐Winner⭐</span>'
        }
    }
}

let builtin_event_lists = {
    bloodbath: [
        new Event(`%0 runs away from the Cornucopia.`),
        new Event(`%0 grabs a shovel.`),
        new Event(`%0 grabs a backpack and retreats.`),
        new Event(`%0 and %1 fight for a bag. %0 gives up and retreats.`),
        new Event(`%0 and %1 fight for a bag. %1 gives up and retreats.`),
        new Event(`%0 finds a bow, some arrows, and a quiver.`),
        new Event(`%0 runs into the cornucopia and hides.`),
        new Event(`%0 finds a canteen full of water.`),
        new Event(`%0 stays at the cornucopia for resources.`),
        new Event(`%0 gathers as much food as %N0 can.`),
        new Event(`%0 grabs a sword.`),
        new Event(`%0 takes a spear from inside the cornucopia.`),
        new Event(`%0 finds a bag full of explosives.`),
        new Event(`%0 clutches a first aid kit and runs away.`),
        new Event(`%0 takes a sickle from inside the cornucopia.`),
        new Event(`%0, %1, and %2 work together to get as many supplies as possible.`),
        new Event(`%0 runs away with a lighter and some rope.`),
        new Event(`%0 snatches a bottle of alcohol and a rag.`),
        new Event(`%0 finds a backpack full of camping equipment.`),
        new Event(`%0 grabs a backpack, not realizing it is empty.`),
        new Event(`%0 breaks %1's nose for a basket of bread.`),
        new Event(`%0, %1, %2, and %3 share everything they gathered before running.`),
        new Event(`%0 retrieves a trident from inside the cornucopia.`),
        new Event(`%0 grabs a jar of fishing bait while %1 gets fishing gear.`),
        new Event(`%0 scares %1 away from the cornucopia.`),
        new Event(`%0 grabs a shield leaning on the cornucopia.`),
        new Event(`%0 snatches a pair of sais.`),

        new Event(`%0 steps off %G0 podium too soon and blows up.`, [0], []),
        new Event(`%0 snaps %1's neck.`, [1], [0]),
        new Event(`%0 finds %1 hiding in the cornucopia and kills %A1.`, [1], [0]),
        new Event(`%0 finds %1 hiding in the cornucopia, but %1 kills %A0.`, [0], [1]),
        new Event(`%0 and %1 fight for a bag. %0 strangles %1 with the straps and runs.`, [1], [0]),
        new Event(`%0 and %1 fight for a bag. %1 strangles %0 with the straps and runs.`, [0], [1])
    ],
    day: [
        new Event(`%0 goes hunting.`),
        new Event(`%0 injures %R0.`),
        new Event(`%0 explores the arena.`),
        new Event(`%0 scares %1 off.`),
        new Event(`%0 diverts %1's attention and runs away.`),
        new Event(`%0 stalks %1.`),
        new Event(`%0 fishes.`),
        new Event(`%0 camouflages %R0 in the bushes.`),
        new Event(`%0 steals from %1 while %N1 %!1 looking.`),
        new Event(`%0 makes a wooden spear.`),
        new Event(`%0 discovers a cave.`),
        new Event(`%0 attacks %1, but %N1 manage%s1 to escape.`),
        new Event(`%0 chases %1.`),
        new Event(`%0 runs away from %1.`),
        new Event(`%0 collects fruit from a tree.`),
        new Event(`%0 receives a hatchet from an unknown sponsor.`),
        new Event(`%0 receives clean water from an unknown sponsor.`),
        new Event(`%0 receives medical supplies from an unknown sponsor.`),
        new Event(`%0 receives fresh food from an unknown sponsor.`),
        new Event(`%0 searches for a water source.`),
        new Event(`%0 defeats %1 in a fight, but spares %G1 life.`),
        new Event(`%0 and %1 work together for the day.`),
        new Event(`%0 begs for %1 to kill %A0. %N1 refuse%s1, keeping %0 alive.`),
        new Event(`%0 tries to sleep through the entire day.`),
        new Event(`%0, %1, %2, and %3 raid %4's camp while %N4 %i4 hunting.`),
        new Event(`%0 constructs a shack.`),
        new Event(`%0 overhears %1 and %2 talking in the distance.`),
        new Event(`%0 practices %G0 archery.`),
        new Event(`%0 thinks about home.`),
        new Event(`%0 is pricked by thorns while picking berries.`),
        new Event(`%0 tries to spear fish with a trident.`),
        new Event(`%0 searches for firewood.`),
        new Event(`%0 and %1 split up to search for resources.`),
        new Event(`%0 picks flowers.`),
        new Event(`%0 tends to %1's wounds.`),
        new Event(`%0 sees smoke rising in the distance, but decides not to investigate.`),
        new Event(`%0 sprains %G0 ankle while running away from %1.`),
        new Event(`%0 makes a slingshot.`),
        new Event(`%0 travels to higher ground.`),
        new Event(`%0 discovers a river.`),
        new Event(`%0 hunts for other tributes.`),
        new Event(`%0 and %1 hunt for other tributes.`),
        new Event(`%0, %1, and %2 hunt for other tributes.`),
        new Event(`%0, %1, %2, and %3 hunt for other tributes.`),
        new Event(`%0, %1, %2, %3, and %4 hunt for other tributes.`),
        new Event(`%0 receives an explosive from an unknown sponsor.`),
        new Event(`%0 questions %G0 sanity.`),

        new Event(`%0 kills %1 while %N1 %i1 resting.`, [1], [0]),
        new Event(`%0 begs for %1 to kill %A0. %N1 reluctantly oblige%s1, killing %0.`, [0], [1]),
        new Event(`%0 bleeds out due to untreated injuries.`, [0], []),
        new Event(`%0 unknowingly eats toxic berries.`, [0], []),
        new Event(`%0 silently snaps %1's neck.`, [1], [0]),
        new Event(`%0 taints %1's food, killing %A1.`, [1], [0]),
        new Event(`%0 dies from an infection.`, [0], []),
        new Event(`%0's trap kills %1.`, [1], [0]),
        new Event(`%0 dies from hypothermia.`, [0], []),
        new Event(`%0 dies from hunger.`, [0], []),
        new Event(`%0 dies from thirst.`, [0], []),
        new Event(`%0 dies trying to escape the arena.`, [0], []),
        new Event(`%0 dies of dysentery.`, [0], []),
        new Event(`%0 accidentally detonates a land mine while trying to arm it.`, [0], []),
        new Event(`%0 ambushes %1 and kills %A1.`, [1], [0]),
        new Event(`%0, %1, and %2 successfully ambush and kill %3, %4, and %5.`, [3, 4, 5], [0, 1, 2]),
        new Event(`%0, %1, and %2 unsuccessfully ambush %3, %4, and %5, who kill them instead.`, [0, 1, 2], [3, 4, 5]),
        new Event(`%0 forces %1 to kill %2 or %3. %N1 decide%s1 to kill %2.`, [2], [1]),
        new Event(`%0 forces %1 to kill %2 or %3. %N1 decide%s1 to kill %3.`, [3], [1]),
        new Event(`%0 forces %1 to kill %2 or %3. %N1 refuse%s1 to kill, so %0 kills %A1 instead.`, [1], [0]),
        new Event(`%0 poisons %1's drink, but mistakes it for %G0 own and dies.`, [0], []),
        new Event(`%0 poisons %1's drink. %N1 drink%s1 it and die%s1.`, [1], [0]),
        new Event(`%0 attempts to climb a tree, but falls on %1, killing them both.`, [0, 1], []),
        new Event(`%0, %1, %2, %3, and %4 track down and kill %5.`, [5], [0, 1, 2, 3, 4]),
        new Event(`%0, %1, %2, and %3 track down and kill %4.`, [4], [0, 1, 2, 3]),
        new Event(`%0, %1, and %2 track down and kill %3.`, [3], [0, 1, 2]),
        new Event(`%0 and %1 track down and kill %2.`, [2], [0, 1]),
        new Event(`%0 tracks down and kills %1.`, [1], [0])
    ],
    night: [
        new Event(`%0 starts a fire.`),
        new Event(`%0 sets up camp for the night.`),
        new Event(`%0 loses sight of where %N0 %i0.`),
        new Event(`%0 climbs a tree to rest.`),
        new Event(`%0 goes to sleep.`),
        new Event(`%0 and %1 tell stories about themselves to each other.`),
        new Event(`%0, %1, %2, and %3 sleep in shifts.`),
        new Event(`%0, %1, and %2 sleep in shifts.`),
        new Event(`%0 and %1 sleep in shifts.`),
        new Event(`%0 tends to %G0 wounds.`),
        new Event(`%0 sees a fire, but stays hidden.`),
        new Event(`%0 screams for help.`),
        new Event(`%0 stays awake all night.`),
        new Event(`%0 passes out from exhaustion.`),
        new Event(`%0 cooks %G0 food before putting %G0 fire out.`),
        new Event(`%0 and %1 run into each other and decide to truce for the night.`),
        new Event(`%0 fends %1, %2, and %3 away from %G0 fire.`),
        new Event(`%0, %1, and %2 discuss the games and what might happen in the morning.`),
        new Event(`%0 cries %R0 to sleep.`),
        new Event(`%0 tries to treat %G0 infection.`),
        new Event(`%0 and %1 talk about the tributes still alive.`),
        new Event(`%0 is awoken by nightmares.`),
        new Event(`%0 and %1 huddle for warmth.`),
        new Event(`%0 thinks about winning.`),
        new Event(`%0, %1, %2, and %3 tell each other ghost stories to lighten the mood.`),
        new Event(`%0 looks at the night sky.`),
        new Event(`%0 defeats %1 in a fight, but spares %G1 life.`),
        new Event(`%0 begs for %1 to kill %A0. %N1 refuse%s1, keeping %0 alive.`),
        new Event(`%0 destroys %1's supplies while %N1 %i1 asleep.`),
        new Event(`%0, %1, %2, %3, and %4 sleep in shifts.`),
        new Event(`%0 lets %1 into %G0 shelter.`),
        new Event(`%0 receives a hatchet from an unknown sponsor.`),
        new Event(`%0 receives clean water from an unknown sponsor.`),
        new Event(`%0 receives medical supplies from an unknown sponsor.`),
        new Event(`%0 receives fresh food from an unknown sponsor.`),
        new Event(`%0 tries to sing %R0 to sleep.`),
        new Event(`%0 attempts to start a fire, but is unsuccessful.`),
        new Event(`%0 thinks about home.`),
        new Event(`%0 tends to %1's wounds.`),
        new Event(`%0 quietly hums.`),
        new Event(`%0, %1, and %2 cheerfully sing songs together.`),
        new Event(`%0 is unable to start a fire and sleeps without warmth.`),
        new Event(`%0 and %1 hold hands.`),
        new Event(`%0 convinces %1 to snuggle with %A0.`),
        new Event(`%0 receives an explosive from an unknown sponsor.`),
        new Event(`%0 questions %G0 sanity.`),

        new Event(`%0 kills %1 while %N1 %i1 sleeping.`, [1], [0]),
        new Event(`%0 begs for %1 to kill %A0. %N1 reluctantly oblige%s1, killing %0.`, [0], [1]),
        new Event(`%0 bleeds out due to untreated injuries.`, [0], []),
        new Event(`%0 unknowingly eats toxic berries.`, [0], []),
        new Event(`%0 silently snaps %1's neck.`, [1], [0]),
        new Event(`%0 taints %1's food, killing %A1.`, [1], [0]),
        new Event(`%0 dies from an infection.`, [0], []),
        new Event(`%0's trap kills %1.`, [1], [0]),
        new Event(`%0 dies from hypothermia.`, [0], []),
        new Event(`%0 dies from hunger.`, [0], []),
        new Event(`%0 dies from thirst.`, [0], []),
        new Event(`%0 dies trying to escape the arena.`, [0], []),
        new Event(`%0 dies of dysentery.`, [0], []),
        new Event(`%0 accidentally detonates a land mine while trying to arm it.`, [0], []),
        new Event(`%0 ambushes %1 and kills %A1.`, [1], [0]),
        new Event(`%0, %1, and %2 successfully ambush and kill %3, %4, and %5.`, [3, 4, 5], [0, 1, 2]),
        new Event(`%0, %1, and %2 unsuccessfully ambush %3, %4, and %5, who kill them instead.`, [0, 1, 2], [3, 4, 5]),
        new Event(`%0 forces %1 to kill %2 or %3. %N1 decide%s1 to kill %2.`, [2], [1]),
        new Event(`%0 forces %1 to kill %2 or %3. %N1 decide%s1 to kill %3.`, [3], [1]),
        new Event(`%0 forces %1 to kill %2 or %3. %N1 refuse%s1 to kill, so %0 kills %A1 instead.`, [1], [0]),
        new Event(`%0 poisons %1's drink, but mistakes it for %G0 own and dies.`, [0], []),
        new Event(`%0 poisons %1's drink. %N1 drink%s1 it and die%s1.`, [1], [0]),
        new Event(`%0 attempts to climb a tree, but falls on %1, killing them both.`, [0, 1], []),
        new Event(`%0, %1, %2, %3, and %4 track down and kill %5.`, [5], [0, 1, 2, 3, 4]),
        new Event(`%0, %1, %2, and %3 track down and kill %4.`, [4], [0, 1, 2, 3]),
        new Event(`%0, %1, and %2 track down and kill %3.`, [3], [0, 1, 2]),
        new Event(`%0 and %1 track down and kill %2.`, [2], [0, 1]),
        new Event(`%0 tracks down and kills %1.`, [1], [0])
    ],
    feast: [
        new Event(`%0 gathers as much food into a bag as %N0 can before fleeing.`),
        new Event(`%0 sobs while gripping a photo of %G0 friends and family.`),
        new Event(`%0 and %1 decide to work together to get more supplies.`),
        new Event(`%0 and %1 get into a fight over raw meat, but %1 gives up and runs away.`),
        new Event(`%0 and %1 get into a fight over raw meat, but %0 gives up and runs away.`),
        new Event(`%0, %1, and %2 confront each other, but grab what they want slowly to avoid conflict.`),
        new Event(`%0 destroys %1's memoirs out of spite.`),
        new Event(`%0, %1, %2, and %3 team up to grab food, supplies, weapons, and memoirs.`),
        new Event(`%0 steals %1's memoirs.`),
        new Event(`%0 takes a staff leaning against the cornucopia.`),
        new Event(`%0 stuffs a bundle of dry clothing into a backpack before sprinting away.`),

        new Event(`%0 bleeds out due to untreated injuries.`, [0], []),
        new Event(`%0 snaps %1's neck.`, [1], [0]),
        new Event(`%0 dies from an infection.`, [0], []),
        new Event(`%0's trap kills %1.`, [1], [0]),
        new Event(`%0 ambushes %1 and kills %A1.`, [1], [0]),
        new Event(`%0, %1, and %2 successfully ambush and kill %3, %4, and %5.`, [3, 4, 5], [0, 1, 2]),
        new Event(`%0, %1, and %2 unsuccessfully ambush %3, %4, and %5, who kill them instead.`, [0, 1, 2], [3, 4, 5]),
        new Event(`%0, %1, %2, %3, and %4 track down and kill %5.`, [5], [0, 1, 2, 3, 4]),
        new Event(`%0, %1, %2, and %3 track down and kill %4.`, [4], [0, 1, 2, 3]),
        new Event(`%0, %1, and %2 track down and kill %3.`, [3], [0, 1, 2]),
        new Event(`%0 and %1 track down and kill %2.`, [2], [0, 1]),
        new Event(`%0 tracks down and kills %1.`, [1], [0])
    ],
    all: [
        new Event(`%0 throws a knife into %1's head.`, [1], [0]),
        new Event(`%0 accidentally steps on a landmine.`, [0], []),
        new Event(`%0 catches %1 off guard and kills %A1.`, [1], [0]),
        new Event(`%0 and %1 work together to drown %2.`, [2], [0, 1]),
        new Event(`%0 strangles %1 after engaging in a fist fight.`, [1], [0]),
        new Event(`%0 shoots an arrow into %1's head.`, [1], [0]),
        new Event(`%0 cannot handle the circumstances and commits suicide.`, [0], []),
        new Event(`%0 bashes %1's head against a rock several times.`, [1], [0]),
        new Event(`%0 decapitates %1 with a sword.`, [1], [0]),
        new Event(`%0 spears %1 in the abdomen.`, [1], [0]),
        new Event(`%0 sets %1 on fire with a molotov.`, [1], [0]),
        new Event(`%0 falls into a pit and dies.`, [0], []),
        new Event(`%0 stabs %1 while %G1 back is turned.`, [1], [0]),
        new Event(`%0 severely injures %1, but puts %A1 out of %G1 misery.`, [1], [0]),
        new Event(`%0 severely injures %1 and leaves %A1 to die.`, [1], [0]),
        new Event(`%0 bashes %1's head in with a mace.`, [1], [0]),
        new Event(`%0 pushes %1 off a cliff during a knife fight.`, [1], [0]),
        new Event(`%0 throws a knife into %1's chest.`, [1], [0]),
        new Event(`%0 is unable to convince %1 to not kill %A0.`, [0], [1]),
        new Event(`%0 convinces %1 to not kill %A0, only to kill %A1 instead.`, [1], [0]),
        new Event(`%0 falls into a frozen lake and drowns.`, [0], []),
        new Event(`%0, %1, and %2 start fighting, but %1 runs away as %0 kills %2.`, [2], [0]),
        new Event(`%0 kills %1 with %G1 own weapon.`, [1], [0]),
        new Event(`%0 overpowers %1, killing %A1.`, [1], [0]),
        new Event(`%0 sets an explosive off, killing %1.`, [1], [0]),
        new Event(`%0 sets an explosive off, killing %1, and %2.`, [1, 2], [0]),
        new Event(`%0 sets an explosive off, killing %1, %2, and %3.`, [1, 2, 3], [0]),
        new Event(`%0 sets an explosive off, killing %1, %2, %3 and %4.`, [1, 2, 3, 4], [0]),
        new Event(`%0 kills %1 as %N1 tr%y1 to run.`, [1], [0]),
        new Event(`%0 and %1 threaten a double suicide. It fails and they die.`, [0, 1], []),
        new Event(`%0, %1, %2, and %3 form a suicide pact, killing themselves.`, [0, 1, 2, 3], []),
        new Event(`%0 kills %1 with a hatchet.`, [1], [0]),
        new Event(`%0 and %1 fight %2 and %3. %0 and %1 survive.`, [2, 3], [0, 1]),
        new Event(`%0 and %1 fight %2 and %3. %2 and %3 survive.`, [0, 1], [2, 3]),
        new Event(`%0 attacks %1, but %2 protects %A1, killing %0.`, [0], [2]),
        new Event(`%0 severely slices %1 with a sword.`, [1], [0]),
        new Event(`%0 strangles %1 with a rope.`, [1], [0]),
        new Event(`%0 kills %1 for %G1 supplies.`, [1], [0]),
        new Event(`%0 shoots an arrow at %1, but misses and kills %2 instead.`, [2], [0]),
        new Event(`%0 shoots a poisonous blow dart into %1's neck, slowly killing %A1.`, [1], [0]),
        new Event(`%0 stabs %1 with a tree branch.`, [1], [0]),
        new Event(`%0 stabs %1 in the back with a trident.`, [1], [0]),
        new Event(`%0, %1, and %2 get into a fight. %0 triumphantly kills them both.`, [1, 2], [0]),
        new Event(`%0, %1, and %2 get into a fight. %1 triumphantly kills them both.`, [0, 2], [1]),
        new Event(`%0, %1, and %2 get into a fight. %2 triumphantly kills them both.`, [0, 1], [2]),
        new Event(`%0 kills %1 with a sickle.`, [1], [0]),
        new Event(`%0 repeatedly stabs %1 to death with sais.`, [1], [0]),

        new Event(`%0 incorporates %1 as a substrate.`, [1], [0], `BIG LANG`),
        new Event(`%0 hunts and eats a pidgin.`, [], [], `BIG LANG`),
        new Event(`%0 and %1 form a creole together.`, [], [], `BIG LANG`),
        new Event(`%0 harvests a wanderwort.`, [], [], `BIG LANG`),
        new Event(`%0 takes a calqueulated risk.`, [], [], `BIG LANG`),
        new Event(`%0 and %1 realise they're from the same language family and form an alliance.`, [], [], `BIG LANG`),
        new Event(`%0 betrays %1—%0 was a false friend!`, [1], [0], `BIG LANG`),
        new Event(`While discussing plans with an ally, %0 accidentally uses an exclusive ‘we’ instead of inclusive, sparking civil war.`, [], [], `BIG LANG`),
        new Event(`Trapped in %0’s snare, %1 has to remove one of %G1 cases to escape.`, [], [], `BIG LANG`),
        new Event(`%0 is feeling tense.`, [], [], `BIG LANG`),
        new Event(`%0 invents pictographic marking to note dangerous parts of the arena.`, [], [], `BIG LANG`),
        new Event(`%0 adapts %1’s symbols, and scrawls grave insults to agitate and distract the other competitors.`, [], [], `BIG LANG`),
        new Event(`%0 labours under the illusion %N0 %i0 ‘pure’ and goes on a rampage, killing %1 and %2 and forcing all others to flee.`, [1, 2], [0], `BIG LANG`),
        new Event(`%0 manages to evolve /tʼ/ into poisonous spit and blinds %1.`, [1], [0], `BIG LANG`),
        new Event(`%0 loses some coda consonants in a scrap with %1 but manages to innovate some tones to maintain the distinctiveness between its phonemes.`, [], [], `BIG LANG`),
        new Event(`%0 undergoes flagrant mergers, resulting in widespread homophony. %N0 then make%s0 many puns, resulting in %1 and %2 ambushing and killing %A0.`, [0], [1, 2], `BIG LANG`),
        new Event(`Following %0 and %1’s alliance, they grow closer and undergo ‘cultural synthesis’. They enjoy the experience, and though they then part ways, they leave an everlasting impression on one another.`, [], [], `BIG LANG`),
        new Event(`Fed up with %0 insisting %N0 %i0 the \"mother of all languages,\" %1 and %2 brutally strangle %A0 and bond over the experience.`, [0], [1, 2], `BIG LANG`),
        new Event(`%0 gets sick and can now only produce nasal vowels.`, [], [], `BIG LANG`)
    ]
}

function FilterQuadruplicateEvents() {
    let lists = Game.event_lists
    let keys = [GameStage.BLOODBATH, GameStage.DAY, GameStage.NIGHT, GameStage.FEAST]
    let all: Event[] = []

    console.log(lists)

    function includes(lst: Event[], event: Event): boolean {
        for (const el of lst)
            if (el.message === event.message) return true
        return false
    }

    for (let key of keys) {
        let lst = lists[key]
        if (lst) for (let ev of lst) {
            let found = 1
            for (let _key of keys) {
                let _lst = lists[_key]
                if (_lst && _lst !== lst && includes(_lst, ev)) found++
            }
            if (found >= 4) if (!includes(all, ev)) all.push(ev)
        }
    }

    for (let ev of all)
        for (let key of keys)
            if (key in lists) lists[key] = (<Event[]>lists[key]).filter(x => x.message !== ev.message)

    if (all.length) {
        if (!lists.all) lists.all = all
        else lists.all.push(...all)
    }

    console.log(lists)

    for (let key of Object.keys(lists)) {
        lists[key] = lists[key].map(x => `new Event(\`${x.message}\`, [${x.fatalities}], [${x.killers}], \`${x.type}\`)`)
    }

    let a = document.createElement('a')
    a.setAttribute('href', 'data:application/json;charset:utf-8,' +
        encodeURIComponent(JSON.stringify(lists, null, 4)))
    a.setAttribute('download', 'events.json')
    a.style.display = 'none'
    document.body.append(a)
    a.click()
    a.remove()
}

Game.event_lists = JSON.parse(JSON.stringify(builtin_event_lists))

// @ts-ignore
window.Game = Game
