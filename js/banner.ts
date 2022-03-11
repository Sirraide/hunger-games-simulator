import { MouseoverContext } from './mouseover.js'

let media800px = window.matchMedia('(max-width: 800px)')
let media1250px = window.matchMedia('(max-width: 1250px)  and (min-width: 800px)')

function ToPixels(rem) {
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize);
}

let nav = document.getElementsByTagName('header')[0]

// @ts-ignore
if ('has_lean_banner' in document && document.has_lean_banner) {
    document.addEventListener('scroll', ev => {
        if (window.scrollY >= ToPixels(16)) {
            nav.style.background = '#1e1e1e'
            nav.style.setProperty('--nav-box-shadow', '-10px 10px 1rem rgba(0, 0, 0, .4)')
            nav.style.setProperty('--nav-a-colour', 'var(--accentmedium)')
        } else {
            nav.style.background = 'linear-gradient(rgba(0, 0, 0, .8), rgba(0, 0, 0, 0))'
            nav.style.setProperty('--nav-box-shadow', 'none')
            nav.style.setProperty('--nav-a-colour', 'white')
        }
    })
} else {
    nav.style.background = '#1e1e1e'
    nav.style.setProperty('--nav-box-shadow', '-10px 10px 1rem rgba(0, 0, 0, .4)')
    nav.style.setProperty('--nav-a-colour', 'var(--accentmedium)')
}

let filename = location.href.split('/').slice(-1).join('')
if (!filename) document.getElementById('page_index')?.classList.add('a-active')
else {
    let active_link
    switch (filename) {
        case 'languages':
        case 'arodjun':
        case 'hvasvan':
        case 'hyperpirate':
        case 'pthm':
        case 'rabbid':
            document.getElementById('page_languages')?.classList.add('a-active')
        /// fallthrough
        default:
            active_link = document.getElementById(`page_${filename}`)
    }
    if (active_link) active_link.classList.add('a-active')
}

let navright = document.querySelector('nav') as HTMLElement
let hamburger_container = document.getElementById('hamburger-container')
new MouseoverContext(media800px, hamburger_container, navright)
    .onenter(() => navright.style.display = 'flex')
    .onleave(() => navright.style.display = 'none')
    .ontoggleon('leave')
    .ontoggleoff('enter')
    .toggleonclick(true)

let collapse_container = document.getElementById('other-collapsable') as HTMLElement
let collapse_into_other = [...collapse_container.children] as HTMLElement[]
new MouseoverContext(media1250px, document.getElementById('page_other'), ...collapse_into_other)
    .onenter(() => {
        collapse_into_other.forEach(el => el.style.display = 'inline-block')
        collapse_container.style.display = 'flex'
    })
    .onleave(() => {
        collapse_into_other.forEach(el => el.style.display = 'none')
        collapse_container.style.display = 'contents'
    })
    .ontoggleon('leave')
    .ontoggleoff(() => {
        collapse_into_other.forEach(el => el.style.display = 'block')
        collapse_container.style.display = 'contents'
    })
    .toggleonclick(true)