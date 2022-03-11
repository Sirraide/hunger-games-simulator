let slideshow_map = new Map<string, number>()

for (let slideshow of document.getElementsByClassName('slideshow') as HTMLCollectionOf<Slideshow>)
    InitSlideshow(slideshow)

function OpenTab(which: string) {
    for (let tab of document.getElementsByClassName('tab-content') as HTMLCollectionOf<HTMLElement>)
        tab.style.display = 'none'
    for (let button of document.getElementsByClassName('tab-button'))
        button.classList.remove('selected-button')

    let element = document.getElementById(which)
    let button = document.getElementById('button_' + which)
    if (!element || !button) return

    element.style.display = 'flex'
    button.classList.add('selected-button')
}

interface Slideshow extends HTMLElement {
    timestamp_last_switched: number
    slideshow_id: number
}

function InitSlideshow(slideshow: Slideshow) {
    let slides = slideshow.getElementsByTagName('img')
    if (slides?.length < 2) return

    slideshow.innerHTML = `<div class="slideshow-slides">`
        + `<div class="before" onClick="Menus.AdvanceSlideshow('${slideshow.id}', -1)">❮</div>`
        + slideshow.innerHTML
        + `<div class="after" onClick="Menus.AdvanceSlideshow('${slideshow.id}', 1)">❯</div>`
        + `</div>`

    let navbar = `<div class="slideshow-navbar"><div class="active" onClick="Menus.JumpToSlide('${slideshow.id}', ${0})"></div>`
    for (let i = 1; i < slides.length; i++) navbar += `<div onClick="Menus.JumpToSlide('${slideshow.id}', ${i})"></div>`
    navbar += '</div>'
    slideshow.insertAdjacentHTML('beforeend', navbar)

    window.setInterval(() => {
        if (new Date().getTime() - slideshow.timestamp_last_switched > 4500)
            AdvanceSlideshow(slideshow.id, 1)
    }, 5000)

    slideshow.timestamp_last_switched = new Date().getTime()

    slideshow_map.set(slideshow.id, 0)
    slides[0].classList.add('active')
}

function UnsetActiveSlide(id: string) {
    let slideshow = document.getElementById(id) as Slideshow
    let slides = slideshow.getElementsByTagName('img')
    let buttons = slideshow.getElementsByClassName('slideshow-navbar')[0].children

    slideshow.timestamp_last_switched = new Date().getTime()

    let active = slideshow_map.get(id) as number

    for (let el of [slides, buttons]) if (el) el[active].classList.remove('active')

    return {slides, buttons, active};
}

function SetActiveSlide(slides: HTMLCollectionOf<HTMLImageElement>, buttons: HTMLCollection, slide: number) {
    for (let el of [slides, buttons]) el[slide].classList.add('active')
}

function AdvanceSlideshow(id: string, increment: number) {
    let {slides, buttons, active} = UnsetActiveSlide(id)

    if (!active && increment === -1) active = slides.length - 1
    else active = (active + increment) % slides.length
    slideshow_map.set(id, active)

    SetActiveSlide(slides, buttons, active)
}

function JumpToSlide(id: string, slide: number) {
    let {slides, buttons} = UnsetActiveSlide(id)
    slideshow_map.set(id, slide)
    SetActiveSlide(slides, buttons, slide)
}

window["Menus"] = {}
window["Menus"].JumpToSlide = JumpToSlide
window["Menus"].AdvanceSlideshow = AdvanceSlideshow

let image_preview = document.getElementById('image-preview') as ImagePreview
let image_preview_container = document.getElementById('image-preview-container') as HTMLElement

interface ImagePreview extends HTMLElement {
    cloned_preview?: Node
}

function OpenImagePreview() {
    let instance = this
    if (window.getComputedStyle(this).getPropertyValue('opacity') === '0') {
        for (let node of this.parentNode.children) {
            if (node.tagName === 'IMG' && window.getComputedStyle(node).getPropertyValue('opacity') !== '0') {
                instance = node
                break
            }
        }
        if (instance === this) return
    }

    image_preview.style.display = 'flex'
    image_preview.cloned_preview = instance.cloneNode(false) as Node
    image_preview.cloned_preview["style"].margin = '0'
    image_preview.cloned_preview["style"].padding = '0'
    image_preview.cloned_preview["style"].maxWidth = image_preview.cloned_preview["style"].maxHeight = '100%'
    image_preview.cloned_preview["style"].height = image_preview.cloned_preview["style"].width = 'auto'
    image_preview.cloned_preview["style"].objectFit = 'contain'
    image_preview.cloned_preview["style"].zIndex = '9999'

    image_preview_container.appendChild(image_preview.cloned_preview)
}

export function CloseImagePreview() {
    image_preview.style.display = 'none'
    image_preview_container.removeChild(image_preview.cloned_preview as Node)
    delete image_preview.cloned_preview
}

export function SetOpenImagePreview() {
    for (let img of document.getElementsByTagName('img')) {
        if (!img.classList.toString().includes('non-previewable-icon')) img.addEventListener('click', OpenImagePreview)
    }
}

image_preview.onclick = CloseImagePreview

SetOpenImagePreview()
