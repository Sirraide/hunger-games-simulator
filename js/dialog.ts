let dialog_wrapper = document.getElementById('dialog-wrapper') as HTMLElement
let dialog_inner = document.getElementById('dialog-inner') as HTMLElement

dialog_wrapper['dialogs'] = new Set()

enum DialogElement {
    ROOT = 'root',
    TITLE = 'title',
    DESCRIPTION = 'description',
    BUTTONS = 'buttons'
}

export enum DialogType {
    DEFAULT,
    ERROR,
    FILE,
    MULTIFILE
}

export enum FileType {
    JSON
}

export interface DialogTemplate {
    title: string
    description: string

    predescription?: any
    postdescription?: any

    type?: DialogType

    accept?
    cancel?
    apply?
    ok?

    apply_callback?

    input_file_format?: FileType
    preserve_extern_urls?: boolean

    root_style?: CSSStyleDeclaration
    title_style?: CSSStyleDeclaration
    description_style?: CSSStyleDeclaration
    buttons_style?: CSSStyleDeclaration
}

export class DialogPromise {
    raw_promise: Promise<DialogData | null>
    resolve: (r: unknown) => void
    reject: (r?: any) => void
    dialog: Dialog

    constructor(dialog: Dialog) {
        dialog.promise = this
        this.dialog = dialog

        let _this = this

        this.raw_promise = new Promise((resolve, reject) => {
            _this.resolve = resolve
            _this.reject = reject
        })
    }
}

export interface DialogData {
    input_file?: File | null
    last_input_text: string | null
    textbox: HTMLInputElement | null
    file_data?: any,
    file_list?: any,
    dialog: Dialog
}

export class Dialog {
    private title: HTMLHeadingElement
    private description: HTMLParagraphElement
    private buttons: HTMLDivElement
    private template: DialogTemplate
    private dialog_type: DialogType

    private optional: any = {}

    promise: DialogPromise
    data: DialogData
    root: HTMLDivElement

    constructor(dialog_template: DialogTemplate) {
        /** Create main elements */
        this.root = document.createElement('div')
        this.title = document.createElement('h5')
        this.description = document.createElement('p')
        this.buttons = document.createElement('div')

        this.template = dialog_template
        this.data = {} as DialogData
        this.data.dialog = this
        let dialog = this.root

        /** Main dialog class */
        dialog.classList.add('dialog')

        /** Apply style overrides */
        for (let el of [DialogElement.ROOT, DialogElement.TITLE, DialogElement.DESCRIPTION, DialogElement.BUTTONS]) {
            const style_key = el + '_style'
            if (style_key in this.template)
                for (let k of Object.keys(this.template[style_key]))
                    if (k !== 'length' && k !== 'cssText')
                        this[el].style[k] = this.template[style_key][k]
        }

        /** Title and description text */
        this.title.innerHTML = this.template.title
        this.description.innerHTML = this.template.description

        /** Construct a promise that will resolve when the dialog is closed */
        new DialogPromise(this)

        /** Append everything except the buttons to the root div */
        dialog.appendChild(this.title)
        if ('predescription' in this.template) dialog.appendChild(this.template.predescription)
        dialog.appendChild(this.description)
        if ('postdescription' in this.template) dialog.appendChild(this.template.postdescription)

        /** Handle different dialog types */
        if (!('type' in this.template)) this.template.type = DialogType.DEFAULT
        switch (this.template.type) {
            case DialogType.ERROR:
                this.ErrorDialog()
                break
            case DialogType.FILE:
                this.FileDialog()
                break
            case DialogType.MULTIFILE:
                this.MultiFileDialog()
                break
            default:
                this.DefaultDialog()
        }
    }

    private DefaultDialog() {
        let _this: Dialog = this

        if ('accept' in this.template) {
            let accept = document.createElement('button')
            let cancel = document.createElement('button')

            this.optional.accept = accept
            this.optional.cancel = cancel

            accept.innerHTML = this.template.accept
            cancel.innerHTML = this.template.cancel

            cancel.onclick = () => this.cancel()
            accept.onclick = () => this.accept()

            this.buttons.appendChild(accept)

            if ('apply' in this.template) {
                let apply = document.createElement('button')
                apply.innerHTML = this.template.apply
                if ('apply_callback' in this.template) apply.onclick = () => this.template.apply_callback(_this)
                else apply.onclick = () => this.accept()

                this.buttons.appendChild(apply)
            }

            this.buttons.appendChild(cancel)
        } else {
            let ok = document.createElement('button')

            ok.innerHTML = this.template.ok
            ok.onclick = () => this.close()

            this.buttons.appendChild(ok)
        }

        this.root.appendChild(this.buttons)
    }

    private ErrorDialog() {
        this.DefaultDialog()
        this.SetDefaultProperty(DialogElement.TITLE, 'background', '#9d2c2c')
        this.SetDefaultProperty(DialogElement.TITLE, 'color', 'whitesmoke')
    }
    private MultiFileDialog() {
        let row = document.createElement('div')
        let input = document.createElement('input')
        let button = document.createElement('button')

        row.classList.add('dialog-element', 'flex-row', 'file-input-control')
        input.type = 'file'
        input.multiple = true;
        button.innerHTML = 'Select Files'
        button.onclick = function (event) {
            event.preventDefault();
            input.click();
        }

        let _this = this
        input.onchange = function (event) {
            if (!event.target) return
            _this.data.file_list = (<HTMLInputElement>event.target)?.files
        }

        row.appendChild(input)
        this.buttons.appendChild(button)
        this.root.appendChild(row)
        this.DefaultDialog()
        if ('accept' in this.optional) this.optional.accept.onclick = () => {
            _this.accept()
        }
    }


    private FileDialog() {
        let row = document.createElement('div')
        let input = document.createElement('input')
        let textbox = document.createElement('input')
        let button = document.createElement('button')

        row.classList.add('dialog-element', 'flex-row', 'file-input-control')
        input.type = 'file'
        textbox.type = 'text'
        textbox.placeholder = 'Enter a URL or click \'Choose a file\''
        button.innerHTML = 'Choose a file'
        button.onclick = function (event) {
            event.preventDefault();
            input.click();
        }

        let _this = this
        input.onchange = function (event) {
            textbox.value = input.value.slice(input.value.lastIndexOf('\\') + 1)
            if (!event.target) return
            _this.data.input_file = (<HTMLInputElement>event.target)?.files?.item(0)
            _this.data.last_input_text = textbox.value
        }

        this.data.textbox = textbox;
        let txtbox = this.data.textbox as HTMLInputElement

        row.appendChild(textbox)
        row.appendChild(input)
        this.buttons.appendChild(button)
        this.root.appendChild(row)

        this.DefaultDialog()

        if ('accept' in this.optional) this.optional.accept.onclick = () => {
            if (this.data.last_input_text !== txtbox.value) delete this.data.input_file

            if (this.data.input_file) {
                let reader = new FileReader()
                if (this.template.input_file_format === FileType.JSON) reader.readAsText(this.data.input_file)
                else reader.readAsDataURL(this.data.input_file)

                reader.onload = () => {
                    if (this.template.input_file_format === FileType.JSON) {
                        let result = reader.result
                        if (result) {
                            if (result instanceof ArrayBuffer) result = (new TextDecoder()).decode(result)
                            this.data.file_data = JSON.parse(result)
                        }
                    } else this.data.file_data = reader.result
                    this.accept()
                }
            } else if (txtbox.value) {
                if (this.template.preserve_extern_urls) {
                    this.data.file_data = txtbox.value
                    this.accept()
                } else
                    fetch(txtbox.value).then(data => {
                        if (this.template.input_file_format === FileType.JSON)
                            data.json().then(json => {
                                this.data.file_data = json
                                this.accept()
                            })
                        else data.blob().then(blob => {
                            this.data.file_data = URL.createObjectURL(blob)
                            this.accept()
                        })
                    })
            }
        }
    }

    private SetDefaultProperty(el: DialogElement, property: string, value: string) {
        if (!(el + '_style' in this.template)) this.template[el + '_style'] = {} as CSSStyleDeclaration
        if (!(property in this.template[el + '_style'])) this[el].style[property] = value
    }

    static open(dialog_template: DialogTemplate) {
        return (new Dialog(dialog_template)).open()
    }

    private close() {
        dialog_wrapper['dialogs'].delete(this)
        dialog_inner.removeChild(this.root)
        if (!dialog_wrapper['dialogs'].size) dialog_wrapper.style.display = 'none'
    }

    open() {
        dialog_wrapper['dialogs'].add(this)
        dialog_inner.appendChild(this.root)
        dialog_wrapper.style.display = 'flex'
        return this.promise.raw_promise
    }

    accept() {
        this.close()
        this.promise.resolve(this.data)
    }

    cancel() {
        this.close()
        this.promise.resolve(null)
    }
}







