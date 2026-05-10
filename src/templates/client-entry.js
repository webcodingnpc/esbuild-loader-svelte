import '{{GLOBAL_SCSS}}'
import { mount, hydrate } from 'svelte'
import App from '{{VIEW_PATH}}'

const target = document.getElementById('app')
const isHydrate = target && target.hasAttribute('data-svelte-hydrate')

const app = isHydrate
    ? hydrate(App, { target })
    : mount(App, { target })

export default app
